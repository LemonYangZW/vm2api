//! `--restricted` 路径守卫：把文件类工具（Read/Edit/Write）的路径限定在
//! cwd + `--add-dir` 白名单内。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §6.3 `restrictedFileConfine` —— 官方 2.1.303 的
//! `--restricted` 要求把 Read/Edit/Write 限定到 cwd 与 `--add-dir`；88 基线没有
//! 这个 choke 点，因此**必须由内核自己补**。
//!
//! 规则：
//! 1. 相对路径按第一个根解析；
//! 2. 拒绝 `..` / `.` 逃逸（按路径段归一，不靠字符串前缀）；
//! 3. 路径**已存在**时先 canonicalize 再判断（防符号链接逃逸）；
//! 4. 路径不存在时，取最近存在的祖先 canonicalize 后判断（防 `a/../..` 形逃逸）。

use std::io;
use std::path::{Component, Path, PathBuf};

/// 越界原因。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfineError {
    Empty,
    NulByte,
    Escapes,
    Outside { path: String },
    Io(String),
}

impl std::fmt::Display for ConfineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfineError::Empty => write!(f, "路径为空"),
            ConfineError::NulByte => write!(f, "路径包含非法字符"),
            ConfineError::Escapes => write!(f, "路径越出允许目录"),
            ConfineError::Outside { path } => write!(f, "路径不在允许目录内: {path}"),
            ConfineError::Io(message) => write!(f, "路径校验失败: {message}"),
        }
    }
}

/// 路径白名单。
#[derive(Debug, Clone)]
pub struct Confine {
    roots: Vec<PathBuf>,
}

impl Confine {
    /// `cwd` + `add_dirs`；根目录必须存在且 canonicalize 成功。
    pub fn new(cwd: impl AsRef<Path>, add_dirs: &[String]) -> io::Result<Self> {
        let mut roots = Vec::new();
        let base = cwd.as_ref().canonicalize()?;
        roots.push(base);
        for dir in add_dirs {
            let path = Path::new(dir);
            let resolved = if path.is_absolute() {
                path.to_path_buf()
            } else {
                roots[0].join(path)
            };
            let canonical = resolved
                .canonicalize()
                .map_err(|e| io::Error::new(e.kind(), format!("add-dir {dir}: {e}")))?;
            if !roots.contains(&canonical) {
                roots.push(canonical);
            }
        }
        Ok(Self { roots })
    }

    pub fn roots(&self) -> &[PathBuf] {
        &self.roots
    }

    /// 校验并返回可用的绝对路径。
    pub fn check(&self, raw: &str) -> Result<PathBuf, ConfineError> {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            return Err(ConfineError::Empty);
        }
        if trimmed.contains('\0') {
            return Err(ConfineError::NulByte);
        }
        let input = Path::new(trimmed);
        let absolute = if input.is_absolute() {
            normalize(input)?
        } else {
            // 相对路径：`..` 深度为负即视为逃逸（不靠字符串前缀判断）。
            let mut depth = 0i32;
            for component in input.components() {
                match component {
                    Component::ParentDir => {
                        depth -= 1;
                        if depth < 0 {
                            return Err(ConfineError::Escapes);
                        }
                    }
                    Component::Normal(_) => depth += 1,
                    _ => {}
                }
            }
            normalize(&self.roots[0].join(input))?
        };
        // 已存在的路径：canonicalize 后再判（防符号链接逃逸）。
        if absolute.exists() {
            let resolved = absolute
                .canonicalize()
                .map_err(|e| ConfineError::Io(e.to_string()))?;
            return self.admit(resolved);
        }
        // 不存在：取最近存在的祖先 canonicalize，再拼回剩余段判断。
        let mut ancestor = absolute.clone();
        let mut rest: Vec<std::ffi::OsString> = Vec::new();
        while !ancestor.exists() {
            let Some(name) = ancestor.file_name().map(|n| n.to_os_string()) else {
                return Err(ConfineError::Outside {
                    path: trimmed.to_string(),
                });
            };
            rest.push(name);
            if !ancestor.pop() {
                return Err(ConfineError::Outside {
                    path: trimmed.to_string(),
                });
            }
        }
        let mut resolved = ancestor
            .canonicalize()
            .map_err(|e| ConfineError::Io(e.to_string()))?;
        for part in rest.iter().rev() {
            if part == ".." {
                return Err(ConfineError::Escapes);
            }
            resolved.push(part);
        }
        self.admit(resolved)
    }

    fn admit(&self, resolved: PathBuf) -> Result<PathBuf, ConfineError> {
        for root in &self.roots {
            if resolved.starts_with(root) {
                return Ok(resolved);
            }
        }
        Err(ConfineError::Outside {
            path: resolved.display().to_string(),
        })
    }
}

/// 只做词法规整（`..` / `.` / 空段），不碰文件系统。
fn normalize(path: &Path) -> Result<PathBuf, ConfineError> {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    return Err(ConfineError::Escapes);
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    Ok(out)
}

/// 常见的路径型工具参数名。
pub const PATH_FIELDS: &[&str] = &[
    "path",
    "file_path",
    "notebook_path",
    "filePath",
    "dir",
    "directory",
    "cwd",
];

/// 从工具参数里提取所有需要校验的路径。
pub fn path_arguments(arguments: &serde_json::Value) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let Some(object) = arguments.as_object() else {
        return out;
    };
    for (key, value) in object {
        if PATH_FIELDS.contains(&key.as_str()) {
            if let Some(text) = value.as_str() {
                out.push((key.clone(), text.to_string()));
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tempdir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "cragv2-confine-{tag}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn accepts_paths_inside_cwd() {
        let dir = tempdir("inside");
        std::fs::create_dir_all(dir.join("sub")).unwrap();
        std::fs::write(dir.join("a.txt"), b"x").unwrap();
        let confine = Confine::new(&dir, &[]).unwrap();
        assert!(confine.check("a.txt").is_ok());
        assert!(confine.check("sub").is_ok());
        assert!(confine.check(dir.join("a.txt").to_str().unwrap()).is_ok());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn rejects_parent_escape() {
        let dir = tempdir("escape");
        let confine = Confine::new(&dir, &[]).unwrap();
        assert!(matches!(confine.check("../outside.txt"), Err(ConfineError::Escapes)));
        // 绝对路径的 `..` 归一后落在白名单外：Escapes / Outside 都算拒绝。
        assert!(matches!(
            confine.check(dir.join("../../outside.txt").to_str().unwrap()),
            Err(ConfineError::Escapes) | Err(ConfineError::Outside { .. })
        ));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn rejects_absolute_path_outside_roots() {
        let dir = tempdir("abs");
        let confine = Confine::new(&dir, &[]).unwrap();
        let outside = std::env::temp_dir().join("definitely-not-inside.txt");
        let error = confine.check(outside.to_str().unwrap()).unwrap_err();
        assert!(matches!(error, ConfineError::Outside { .. }), "{error:?}");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn add_dir_extends_roots() {
        let base = tempdir("base");
        let extra = tempdir("extra");
        std::fs::write(extra.join("b.txt"), b"y").unwrap();
        let confine = Confine::new(&base, &[extra.to_string_lossy().to_string()]).unwrap();
        // add-dir 里的绝对路径可访问。
        assert!(confine.check(extra.join("b.txt").to_str().unwrap()).is_ok());
        // 相对路径按 cwd 解析：落在 cwd 内即使文件不存在也放行（工具可能创建）。
        assert!(confine.check("b.txt").is_ok());
        // 但 add-dir 目录本身不在 cwd 下，相对路径不会指过去。
        assert_eq!(
            confine.check("b.txt").unwrap(),
            confine.roots()[0].join("b.txt")
        );
        std::fs::remove_dir_all(&base).ok();
        std::fs::remove_dir_all(&extra).ok();
    }

    #[test]
    fn rejects_empty_and_nul() {
        let dir = tempdir("empty");
        let confine = Confine::new(&dir, &[]).unwrap();
        assert_eq!(confine.check("   "), Err(ConfineError::Empty));
        assert_eq!(confine.check("a\0b"), Err(ConfineError::NulByte));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn extracts_path_arguments() {
        let args = serde_json::json!({
            "path": "/tmp/a",
            "file_path": "/tmp/b",
            "content": "ignore",
            "depth": 3
        });
        let mut found = path_arguments(&args);
        found.sort();
        assert_eq!(
            found,
            vec![
                ("file_path".to_string(), "/tmp/b".to_string()),
                ("path".to_string(), "/tmp/a".to_string())
            ]
        );
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escape() {
        let dir = tempdir("symlink");
        let outside = tempdir("symlink-outside");
        std::fs::write(outside.join("secret.txt"), b"s").unwrap();
        let link = dir.join("link");
        std::os::unix::fs::symlink(&outside, &link).unwrap();
        let confine = Confine::new(&dir, &[]).unwrap();
        let error = confine.check("link/secret.txt").unwrap_err();
        assert!(matches!(error, ConfineError::Outside { .. }), "{error:?}");
        std::fs::remove_dir_all(&dir).ok();
        std::fs::remove_dir_all(&outside).ok();
    }
}
