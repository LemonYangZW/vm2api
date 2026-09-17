// @bun
import {
  require_ajv,
  require_codegen
} from "./chunk-hjmatcgt.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  _enum,
  _null,
  array,
  boolean,
  custom,
  discriminatedUnion,
  exports_iso,
  init_core,
  init_locales,
  intersection,
  literal,
  looseObject,
  number,
  object,
  optional,
  preprocess,
  record,
  safeParse,
  string,
  union,
  unknown
} from "./chunk-ch92ycde.js";
import {
  __commonJS,
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var LATEST_PROTOCOL_VERSION = "2025-11-25", SUPPORTED_PROTOCOL_VERSIONS, RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task", JSONRPC_VERSION = "2.0", AssertObjectSchema, ProgressTokenSchema, CursorSchema, TaskCreationParamsSchema, TaskMetadataSchema, RelatedTaskMetadataSchema, RequestMetaSchema, BaseRequestParamsSchema, TaskAugmentedRequestParamsSchema, isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success, RequestSchema, NotificationsParamsSchema, NotificationSchema, ResultSchema, RequestIdSchema, JSONRPCRequestSchema, isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success, JSONRPCNotificationSchema, isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success, JSONRPCResultResponseSchema, isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success, ErrorCode, JSONRPCErrorResponseSchema, isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success, JSONRPCMessageSchema, JSONRPCResponseSchema, EmptyResultSchema, CancelledNotificationParamsSchema, CancelledNotificationSchema, IconSchema, IconsSchema, BaseMetadataSchema, ImplementationSchema, FormElicitationCapabilitySchema, ElicitationCapabilitySchema, ClientTasksCapabilitySchema, ServerTasksCapabilitySchema, ClientCapabilitiesSchema, InitializeRequestParamsSchema, InitializeRequestSchema, ServerCapabilitiesSchema, InitializeResultSchema, InitializedNotificationSchema, isInitializedNotification = (value) => InitializedNotificationSchema.safeParse(value).success, PingRequestSchema, ProgressSchema, ProgressNotificationParamsSchema, ProgressNotificationSchema, PaginatedRequestParamsSchema, PaginatedRequestSchema, PaginatedResultSchema, TaskStatusSchema, TaskSchema, CreateTaskResultSchema, TaskStatusNotificationParamsSchema, TaskStatusNotificationSchema, GetTaskRequestSchema, GetTaskResultSchema, GetTaskPayloadRequestSchema, GetTaskPayloadResultSchema, ListTasksRequestSchema, ListTasksResultSchema, CancelTaskRequestSchema, CancelTaskResultSchema, ResourceContentsSchema, TextResourceContentsSchema, Base64Schema, BlobResourceContentsSchema, RoleSchema, AnnotationsSchema, ResourceSchema, ResourceTemplateSchema, ListResourcesRequestSchema, ListResourcesResultSchema, ListResourceTemplatesRequestSchema, ListResourceTemplatesResultSchema, ResourceRequestParamsSchema, ReadResourceRequestParamsSchema, ReadResourceRequestSchema, ReadResourceResultSchema, ResourceListChangedNotificationSchema, SubscribeRequestParamsSchema, SubscribeRequestSchema, UnsubscribeRequestParamsSchema, UnsubscribeRequestSchema, ResourceUpdatedNotificationParamsSchema, ResourceUpdatedNotificationSchema, PromptArgumentSchema, PromptSchema, ListPromptsRequestSchema, ListPromptsResultSchema, GetPromptRequestParamsSchema, GetPromptRequestSchema, TextContentSchema, ImageContentSchema, AudioContentSchema, ToolUseContentSchema, EmbeddedResourceSchema, ResourceLinkSchema, ContentBlockSchema, PromptMessageSchema, GetPromptResultSchema, PromptListChangedNotificationSchema, ToolAnnotationsSchema, ToolExecutionSchema, ToolSchema, ListToolsRequestSchema, ListToolsResultSchema, CallToolResultSchema, CompatibilityCallToolResultSchema, CallToolRequestParamsSchema, CallToolRequestSchema, ToolListChangedNotificationSchema, ListChangedOptionsBaseSchema, LoggingLevelSchema, SetLevelRequestParamsSchema, SetLevelRequestSchema, LoggingMessageNotificationParamsSchema, LoggingMessageNotificationSchema, ModelHintSchema, ModelPreferencesSchema, ToolChoiceSchema, ToolResultContentSchema, SamplingContentSchema, SamplingMessageContentBlockSchema, SamplingMessageSchema, CreateMessageRequestParamsSchema, CreateMessageRequestSchema, CreateMessageResultSchema, CreateMessageResultWithToolsSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema, UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema, LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema, EnumSchemaSchema, PrimitiveSchemaDefinitionSchema, ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema, ElicitRequestParamsSchema, ElicitRequestSchema, ElicitationCompleteNotificationParamsSchema, ElicitationCompleteNotificationSchema, ElicitResultSchema, ResourceTemplateReferenceSchema, PromptReferenceSchema, CompleteRequestParamsSchema, CompleteRequestSchema, CompleteResultSchema, RootSchema, ListRootsRequestSchema, ListRootsResultSchema, RootsListChangedNotificationSchema, ClientRequestSchema, ClientNotificationSchema, ClientResultSchema, ServerRequestSchema, ServerNotificationSchema, ServerResultSchema, McpError, UrlElicitationRequiredError;
var init_types = __esm(() => {
  init_v4();
  SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
  AssertObjectSchema = custom((v) => v !== null && (typeof v === "object" || typeof v === "function"));
  ProgressTokenSchema = union([string(), number().int()]);
  CursorSchema = string();
  TaskCreationParamsSchema = looseObject({
    ttl: number().optional(),
    pollInterval: number().optional()
  });
  TaskMetadataSchema = object({
    ttl: number().optional()
  });
  RelatedTaskMetadataSchema = object({
    taskId: string()
  });
  RequestMetaSchema = looseObject({
    progressToken: ProgressTokenSchema.optional(),
    [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
  });
  BaseRequestParamsSchema = object({
    _meta: RequestMetaSchema.optional()
  });
  TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
    task: TaskMetadataSchema.optional()
  });
  RequestSchema = object({
    method: string(),
    params: BaseRequestParamsSchema.loose().optional()
  });
  NotificationsParamsSchema = object({
    _meta: RequestMetaSchema.optional()
  });
  NotificationSchema = object({
    method: string(),
    params: NotificationsParamsSchema.loose().optional()
  });
  ResultSchema = looseObject({
    _meta: RequestMetaSchema.optional()
  });
  RequestIdSchema = union([string(), number().int()]);
  JSONRPCRequestSchema = object({
    jsonrpc: literal(JSONRPC_VERSION),
    id: RequestIdSchema,
    ...RequestSchema.shape
  }).strict();
  JSONRPCNotificationSchema = object({
    jsonrpc: literal(JSONRPC_VERSION),
    ...NotificationSchema.shape
  }).strict();
  JSONRPCResultResponseSchema = object({
    jsonrpc: literal(JSONRPC_VERSION),
    id: RequestIdSchema,
    result: ResultSchema
  }).strict();
  (function(ErrorCode2) {
    ErrorCode2[ErrorCode2["ConnectionClosed"] = -32000] = "ConnectionClosed";
    ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
    ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
    ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
    ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
    ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
    ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
    ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
  })(ErrorCode || (ErrorCode = {}));
  JSONRPCErrorResponseSchema = object({
    jsonrpc: literal(JSONRPC_VERSION),
    id: RequestIdSchema.optional(),
    error: object({
      code: number().int(),
      message: string(),
      data: unknown().optional()
    })
  }).strict();
  JSONRPCMessageSchema = union([
    JSONRPCRequestSchema,
    JSONRPCNotificationSchema,
    JSONRPCResultResponseSchema,
    JSONRPCErrorResponseSchema
  ]);
  JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
  EmptyResultSchema = ResultSchema.strict();
  CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
    requestId: RequestIdSchema.optional(),
    reason: string().optional()
  });
  CancelledNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/cancelled"),
    params: CancelledNotificationParamsSchema
  });
  IconSchema = object({
    src: string(),
    mimeType: string().optional(),
    sizes: array(string()).optional(),
    theme: _enum(["light", "dark"]).optional()
  });
  IconsSchema = object({
    icons: array(IconSchema).optional()
  });
  BaseMetadataSchema = object({
    name: string(),
    title: string().optional()
  });
  ImplementationSchema = BaseMetadataSchema.extend({
    ...BaseMetadataSchema.shape,
    ...IconsSchema.shape,
    version: string(),
    websiteUrl: string().optional(),
    description: string().optional()
  });
  FormElicitationCapabilitySchema = intersection(object({
    applyDefaults: boolean().optional()
  }), record(string(), unknown()));
  ElicitationCapabilitySchema = preprocess((value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (Object.keys(value).length === 0) {
        return { form: {} };
      }
    }
    return value;
  }, intersection(object({
    form: FormElicitationCapabilitySchema.optional(),
    url: AssertObjectSchema.optional()
  }), record(string(), unknown()).optional()));
  ClientTasksCapabilitySchema = looseObject({
    list: AssertObjectSchema.optional(),
    cancel: AssertObjectSchema.optional(),
    requests: looseObject({
      sampling: looseObject({
        createMessage: AssertObjectSchema.optional()
      }).optional(),
      elicitation: looseObject({
        create: AssertObjectSchema.optional()
      }).optional()
    }).optional()
  });
  ServerTasksCapabilitySchema = looseObject({
    list: AssertObjectSchema.optional(),
    cancel: AssertObjectSchema.optional(),
    requests: looseObject({
      tools: looseObject({
        call: AssertObjectSchema.optional()
      }).optional()
    }).optional()
  });
  ClientCapabilitiesSchema = object({
    experimental: record(string(), AssertObjectSchema).optional(),
    sampling: object({
      context: AssertObjectSchema.optional(),
      tools: AssertObjectSchema.optional()
    }).optional(),
    elicitation: ElicitationCapabilitySchema.optional(),
    roots: object({
      listChanged: boolean().optional()
    }).optional(),
    tasks: ClientTasksCapabilitySchema.optional(),
    extensions: record(string(), AssertObjectSchema).optional()
  });
  InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
    protocolVersion: string(),
    capabilities: ClientCapabilitiesSchema,
    clientInfo: ImplementationSchema
  });
  InitializeRequestSchema = RequestSchema.extend({
    method: literal("initialize"),
    params: InitializeRequestParamsSchema
  });
  ServerCapabilitiesSchema = object({
    experimental: record(string(), AssertObjectSchema).optional(),
    logging: AssertObjectSchema.optional(),
    completions: AssertObjectSchema.optional(),
    prompts: object({
      listChanged: boolean().optional()
    }).optional(),
    resources: object({
      subscribe: boolean().optional(),
      listChanged: boolean().optional()
    }).optional(),
    tools: object({
      listChanged: boolean().optional()
    }).optional(),
    tasks: ServerTasksCapabilitySchema.optional(),
    extensions: record(string(), AssertObjectSchema).optional()
  });
  InitializeResultSchema = ResultSchema.extend({
    protocolVersion: string(),
    capabilities: ServerCapabilitiesSchema,
    serverInfo: ImplementationSchema,
    instructions: string().optional()
  });
  InitializedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/initialized"),
    params: NotificationsParamsSchema.optional()
  });
  PingRequestSchema = RequestSchema.extend({
    method: literal("ping"),
    params: BaseRequestParamsSchema.optional()
  });
  ProgressSchema = object({
    progress: number(),
    total: optional(number()),
    message: optional(string())
  });
  ProgressNotificationParamsSchema = object({
    ...NotificationsParamsSchema.shape,
    ...ProgressSchema.shape,
    progressToken: ProgressTokenSchema
  });
  ProgressNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/progress"),
    params: ProgressNotificationParamsSchema
  });
  PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
    cursor: CursorSchema.optional()
  });
  PaginatedRequestSchema = RequestSchema.extend({
    params: PaginatedRequestParamsSchema.optional()
  });
  PaginatedResultSchema = ResultSchema.extend({
    nextCursor: CursorSchema.optional()
  });
  TaskStatusSchema = _enum(["working", "input_required", "completed", "failed", "cancelled"]);
  TaskSchema = object({
    taskId: string(),
    status: TaskStatusSchema,
    ttl: union([number(), _null()]),
    createdAt: string(),
    lastUpdatedAt: string(),
    pollInterval: optional(number()),
    statusMessage: optional(string())
  });
  CreateTaskResultSchema = ResultSchema.extend({
    task: TaskSchema
  });
  TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
  TaskStatusNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/tasks/status"),
    params: TaskStatusNotificationParamsSchema
  });
  GetTaskRequestSchema = RequestSchema.extend({
    method: literal("tasks/get"),
    params: BaseRequestParamsSchema.extend({
      taskId: string()
    })
  });
  GetTaskResultSchema = ResultSchema.merge(TaskSchema);
  GetTaskPayloadRequestSchema = RequestSchema.extend({
    method: literal("tasks/result"),
    params: BaseRequestParamsSchema.extend({
      taskId: string()
    })
  });
  GetTaskPayloadResultSchema = ResultSchema.loose();
  ListTasksRequestSchema = PaginatedRequestSchema.extend({
    method: literal("tasks/list")
  });
  ListTasksResultSchema = PaginatedResultSchema.extend({
    tasks: array(TaskSchema)
  });
  CancelTaskRequestSchema = RequestSchema.extend({
    method: literal("tasks/cancel"),
    params: BaseRequestParamsSchema.extend({
      taskId: string()
    })
  });
  CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
  ResourceContentsSchema = object({
    uri: string(),
    mimeType: optional(string()),
    _meta: record(string(), unknown()).optional()
  });
  TextResourceContentsSchema = ResourceContentsSchema.extend({
    text: string()
  });
  Base64Schema = string().refine((val) => {
    try {
      atob(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid Base64 string" });
  BlobResourceContentsSchema = ResourceContentsSchema.extend({
    blob: Base64Schema
  });
  RoleSchema = _enum(["user", "assistant"]);
  AnnotationsSchema = object({
    audience: array(RoleSchema).optional(),
    priority: number().min(0).max(1).optional(),
    lastModified: exports_iso.datetime({ offset: true }).optional()
  });
  ResourceSchema = object({
    ...BaseMetadataSchema.shape,
    ...IconsSchema.shape,
    uri: string(),
    description: optional(string()),
    mimeType: optional(string()),
    size: optional(number()),
    annotations: AnnotationsSchema.optional(),
    _meta: optional(looseObject({}))
  });
  ResourceTemplateSchema = object({
    ...BaseMetadataSchema.shape,
    ...IconsSchema.shape,
    uriTemplate: string(),
    description: optional(string()),
    mimeType: optional(string()),
    annotations: AnnotationsSchema.optional(),
    _meta: optional(looseObject({}))
  });
  ListResourcesRequestSchema = PaginatedRequestSchema.extend({
    method: literal("resources/list")
  });
  ListResourcesResultSchema = PaginatedResultSchema.extend({
    resources: array(ResourceSchema)
  });
  ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
    method: literal("resources/templates/list")
  });
  ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
    resourceTemplates: array(ResourceTemplateSchema)
  });
  ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
    uri: string()
  });
  ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
  ReadResourceRequestSchema = RequestSchema.extend({
    method: literal("resources/read"),
    params: ReadResourceRequestParamsSchema
  });
  ReadResourceResultSchema = ResultSchema.extend({
    contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema]))
  });
  ResourceListChangedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/resources/list_changed"),
    params: NotificationsParamsSchema.optional()
  });
  SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
  SubscribeRequestSchema = RequestSchema.extend({
    method: literal("resources/subscribe"),
    params: SubscribeRequestParamsSchema
  });
  UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
  UnsubscribeRequestSchema = RequestSchema.extend({
    method: literal("resources/unsubscribe"),
    params: UnsubscribeRequestParamsSchema
  });
  ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
    uri: string()
  });
  ResourceUpdatedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/resources/updated"),
    params: ResourceUpdatedNotificationParamsSchema
  });
  PromptArgumentSchema = object({
    name: string(),
    description: optional(string()),
    required: optional(boolean())
  });
  PromptSchema = object({
    ...BaseMetadataSchema.shape,
    ...IconsSchema.shape,
    description: optional(string()),
    arguments: optional(array(PromptArgumentSchema)),
    _meta: optional(looseObject({}))
  });
  ListPromptsRequestSchema = PaginatedRequestSchema.extend({
    method: literal("prompts/list")
  });
  ListPromptsResultSchema = PaginatedResultSchema.extend({
    prompts: array(PromptSchema)
  });
  GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
    name: string(),
    arguments: record(string(), string()).optional()
  });
  GetPromptRequestSchema = RequestSchema.extend({
    method: literal("prompts/get"),
    params: GetPromptRequestParamsSchema
  });
  TextContentSchema = object({
    type: literal("text"),
    text: string(),
    annotations: AnnotationsSchema.optional(),
    _meta: record(string(), unknown()).optional()
  });
  ImageContentSchema = object({
    type: literal("image"),
    data: Base64Schema,
    mimeType: string(),
    annotations: AnnotationsSchema.optional(),
    _meta: record(string(), unknown()).optional()
  });
  AudioContentSchema = object({
    type: literal("audio"),
    data: Base64Schema,
    mimeType: string(),
    annotations: AnnotationsSchema.optional(),
    _meta: record(string(), unknown()).optional()
  });
  ToolUseContentSchema = object({
    type: literal("tool_use"),
    name: string(),
    id: string(),
    input: record(string(), unknown()),
    _meta: record(string(), unknown()).optional()
  });
  EmbeddedResourceSchema = object({
    type: literal("resource"),
    resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
    annotations: AnnotationsSchema.optional(),
    _meta: record(string(), unknown()).optional()
  });
  ResourceLinkSchema = ResourceSchema.extend({
    type: literal("resource_link")
  });
  ContentBlockSchema = union([
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    ResourceLinkSchema,
    EmbeddedResourceSchema
  ]);
  PromptMessageSchema = object({
    role: RoleSchema,
    content: ContentBlockSchema
  });
  GetPromptResultSchema = ResultSchema.extend({
    description: string().optional(),
    messages: array(PromptMessageSchema)
  });
  PromptListChangedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/prompts/list_changed"),
    params: NotificationsParamsSchema.optional()
  });
  ToolAnnotationsSchema = object({
    title: string().optional(),
    readOnlyHint: boolean().optional(),
    destructiveHint: boolean().optional(),
    idempotentHint: boolean().optional(),
    openWorldHint: boolean().optional()
  });
  ToolExecutionSchema = object({
    taskSupport: _enum(["required", "optional", "forbidden"]).optional()
  });
  ToolSchema = object({
    ...BaseMetadataSchema.shape,
    ...IconsSchema.shape,
    description: string().optional(),
    inputSchema: object({
      type: literal("object"),
      properties: record(string(), AssertObjectSchema).optional(),
      required: array(string()).optional()
    }).catchall(unknown()),
    outputSchema: object({
      type: literal("object"),
      properties: record(string(), AssertObjectSchema).optional(),
      required: array(string()).optional()
    }).catchall(unknown()).optional(),
    annotations: ToolAnnotationsSchema.optional(),
    execution: ToolExecutionSchema.optional(),
    _meta: record(string(), unknown()).optional()
  });
  ListToolsRequestSchema = PaginatedRequestSchema.extend({
    method: literal("tools/list")
  });
  ListToolsResultSchema = PaginatedResultSchema.extend({
    tools: array(ToolSchema)
  });
  CallToolResultSchema = ResultSchema.extend({
    content: array(ContentBlockSchema).default([]),
    structuredContent: record(string(), unknown()).optional(),
    isError: boolean().optional()
  });
  CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
    toolResult: unknown()
  }));
  CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
    name: string(),
    arguments: record(string(), unknown()).optional()
  });
  CallToolRequestSchema = RequestSchema.extend({
    method: literal("tools/call"),
    params: CallToolRequestParamsSchema
  });
  ToolListChangedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/tools/list_changed"),
    params: NotificationsParamsSchema.optional()
  });
  ListChangedOptionsBaseSchema = object({
    autoRefresh: boolean().default(true),
    debounceMs: number().int().nonnegative().default(300)
  });
  LoggingLevelSchema = _enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
  SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
    level: LoggingLevelSchema
  });
  SetLevelRequestSchema = RequestSchema.extend({
    method: literal("logging/setLevel"),
    params: SetLevelRequestParamsSchema
  });
  LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
    level: LoggingLevelSchema,
    logger: string().optional(),
    data: unknown()
  });
  LoggingMessageNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/message"),
    params: LoggingMessageNotificationParamsSchema
  });
  ModelHintSchema = object({
    name: string().optional()
  });
  ModelPreferencesSchema = object({
    hints: array(ModelHintSchema).optional(),
    costPriority: number().min(0).max(1).optional(),
    speedPriority: number().min(0).max(1).optional(),
    intelligencePriority: number().min(0).max(1).optional()
  });
  ToolChoiceSchema = object({
    mode: _enum(["auto", "required", "none"]).optional()
  });
  ToolResultContentSchema = object({
    type: literal("tool_result"),
    toolUseId: string().describe("The unique identifier for the corresponding tool call."),
    content: array(ContentBlockSchema).default([]),
    structuredContent: object({}).loose().optional(),
    isError: boolean().optional(),
    _meta: record(string(), unknown()).optional()
  });
  SamplingContentSchema = discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
  SamplingMessageContentBlockSchema = discriminatedUnion("type", [
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    ToolUseContentSchema,
    ToolResultContentSchema
  ]);
  SamplingMessageSchema = object({
    role: RoleSchema,
    content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
    _meta: record(string(), unknown()).optional()
  });
  CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
    messages: array(SamplingMessageSchema),
    modelPreferences: ModelPreferencesSchema.optional(),
    systemPrompt: string().optional(),
    includeContext: _enum(["none", "thisServer", "allServers"]).optional(),
    temperature: number().optional(),
    maxTokens: number().int(),
    stopSequences: array(string()).optional(),
    metadata: AssertObjectSchema.optional(),
    tools: array(ToolSchema).optional(),
    toolChoice: ToolChoiceSchema.optional()
  });
  CreateMessageRequestSchema = RequestSchema.extend({
    method: literal("sampling/createMessage"),
    params: CreateMessageRequestParamsSchema
  });
  CreateMessageResultSchema = ResultSchema.extend({
    model: string(),
    stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens"]).or(string())),
    role: RoleSchema,
    content: SamplingContentSchema
  });
  CreateMessageResultWithToolsSchema = ResultSchema.extend({
    model: string(),
    stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(string())),
    role: RoleSchema,
    content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
  });
  BooleanSchemaSchema = object({
    type: literal("boolean"),
    title: string().optional(),
    description: string().optional(),
    default: boolean().optional()
  });
  StringSchemaSchema = object({
    type: literal("string"),
    title: string().optional(),
    description: string().optional(),
    minLength: number().optional(),
    maxLength: number().optional(),
    format: _enum(["email", "uri", "date", "date-time"]).optional(),
    default: string().optional()
  });
  NumberSchemaSchema = object({
    type: _enum(["number", "integer"]),
    title: string().optional(),
    description: string().optional(),
    minimum: number().optional(),
    maximum: number().optional(),
    default: number().optional()
  });
  UntitledSingleSelectEnumSchemaSchema = object({
    type: literal("string"),
    title: string().optional(),
    description: string().optional(),
    enum: array(string()),
    default: string().optional()
  });
  TitledSingleSelectEnumSchemaSchema = object({
    type: literal("string"),
    title: string().optional(),
    description: string().optional(),
    oneOf: array(object({
      const: string(),
      title: string()
    })),
    default: string().optional()
  });
  LegacyTitledEnumSchemaSchema = object({
    type: literal("string"),
    title: string().optional(),
    description: string().optional(),
    enum: array(string()),
    enumNames: array(string()).optional(),
    default: string().optional()
  });
  SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
  UntitledMultiSelectEnumSchemaSchema = object({
    type: literal("array"),
    title: string().optional(),
    description: string().optional(),
    minItems: number().optional(),
    maxItems: number().optional(),
    items: object({
      type: literal("string"),
      enum: array(string())
    }),
    default: array(string()).optional()
  });
  TitledMultiSelectEnumSchemaSchema = object({
    type: literal("array"),
    title: string().optional(),
    description: string().optional(),
    minItems: number().optional(),
    maxItems: number().optional(),
    items: object({
      anyOf: array(object({
        const: string(),
        title: string()
      }))
    }),
    default: array(string()).optional()
  });
  MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
  EnumSchemaSchema = union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
  PrimitiveSchemaDefinitionSchema = union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
  ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
    mode: literal("form").optional(),
    message: string(),
    requestedSchema: object({
      type: literal("object"),
      properties: record(string(), PrimitiveSchemaDefinitionSchema),
      required: array(string()).optional()
    })
  });
  ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
    mode: literal("url"),
    message: string(),
    elicitationId: string(),
    url: string().url()
  });
  ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
  ElicitRequestSchema = RequestSchema.extend({
    method: literal("elicitation/create"),
    params: ElicitRequestParamsSchema
  });
  ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
    elicitationId: string()
  });
  ElicitationCompleteNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/elicitation/complete"),
    params: ElicitationCompleteNotificationParamsSchema
  });
  ElicitResultSchema = ResultSchema.extend({
    action: _enum(["accept", "decline", "cancel"]),
    content: preprocess((val) => val === null ? undefined : val, record(string(), union([string(), number(), boolean(), array(string())])).optional())
  });
  ResourceTemplateReferenceSchema = object({
    type: literal("ref/resource"),
    uri: string()
  });
  PromptReferenceSchema = object({
    type: literal("ref/prompt"),
    name: string()
  });
  CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
    ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
    argument: object({
      name: string(),
      value: string()
    }),
    context: object({
      arguments: record(string(), string()).optional()
    }).optional()
  });
  CompleteRequestSchema = RequestSchema.extend({
    method: literal("completion/complete"),
    params: CompleteRequestParamsSchema
  });
  CompleteResultSchema = ResultSchema.extend({
    completion: looseObject({
      values: array(string()).max(100),
      total: optional(number().int()),
      hasMore: optional(boolean())
    })
  });
  RootSchema = object({
    uri: string().startsWith("file://"),
    name: string().optional(),
    _meta: record(string(), unknown()).optional()
  });
  ListRootsRequestSchema = RequestSchema.extend({
    method: literal("roots/list"),
    params: BaseRequestParamsSchema.optional()
  });
  ListRootsResultSchema = ResultSchema.extend({
    roots: array(RootSchema)
  });
  RootsListChangedNotificationSchema = NotificationSchema.extend({
    method: literal("notifications/roots/list_changed"),
    params: NotificationsParamsSchema.optional()
  });
  ClientRequestSchema = union([
    PingRequestSchema,
    InitializeRequestSchema,
    CompleteRequestSchema,
    SetLevelRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    SubscribeRequestSchema,
    UnsubscribeRequestSchema,
    CallToolRequestSchema,
    ListToolsRequestSchema,
    GetTaskRequestSchema,
    GetTaskPayloadRequestSchema,
    ListTasksRequestSchema,
    CancelTaskRequestSchema
  ]);
  ClientNotificationSchema = union([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    InitializedNotificationSchema,
    RootsListChangedNotificationSchema,
    TaskStatusNotificationSchema
  ]);
  ClientResultSchema = union([
    EmptyResultSchema,
    CreateMessageResultSchema,
    CreateMessageResultWithToolsSchema,
    ElicitResultSchema,
    ListRootsResultSchema,
    GetTaskResultSchema,
    ListTasksResultSchema,
    CreateTaskResultSchema
  ]);
  ServerRequestSchema = union([
    PingRequestSchema,
    CreateMessageRequestSchema,
    ElicitRequestSchema,
    ListRootsRequestSchema,
    GetTaskRequestSchema,
    GetTaskPayloadRequestSchema,
    ListTasksRequestSchema,
    CancelTaskRequestSchema
  ]);
  ServerNotificationSchema = union([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    LoggingMessageNotificationSchema,
    ResourceUpdatedNotificationSchema,
    ResourceListChangedNotificationSchema,
    ToolListChangedNotificationSchema,
    PromptListChangedNotificationSchema,
    TaskStatusNotificationSchema,
    ElicitationCompleteNotificationSchema
  ]);
  ServerResultSchema = union([
    EmptyResultSchema,
    InitializeResultSchema,
    CompleteResultSchema,
    GetPromptResultSchema,
    ListPromptsResultSchema,
    ListResourcesResultSchema,
    ListResourceTemplatesResultSchema,
    ReadResourceResultSchema,
    CallToolResultSchema,
    ListToolsResultSchema,
    GetTaskResultSchema,
    ListTasksResultSchema,
    CreateTaskResultSchema
  ]);
  McpError = class McpError extends Error {
    constructor(code, message, data) {
      super(`MCP error ${code}: ${message}`);
      this.code = code;
      this.data = data;
      this.name = "McpError";
    }
    static fromError(code, message, data) {
      if (code === ErrorCode.UrlElicitationRequired && data) {
        const errorData = data;
        if (errorData.elicitations) {
          return new UrlElicitationRequiredError(errorData.elicitations, message);
        }
      }
      return new McpError(code, message, data);
    }
  };
  UrlElicitationRequiredError = class UrlElicitationRequiredError extends McpError {
    constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
      super(ErrorCode.UrlElicitationRequired, message, {
        elicitations
      });
    }
    get elicitations() {
      return this.data?.elicitations ?? [];
    }
  };
});

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/parse.js
var init_parse = __esm(() => {
  init_core();
});

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/schemas.js
var init_schemas = () => {};

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/checks.js
var init_checks = () => {};

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/iso.js
var init_iso = () => {};

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/coerce.js
var init_coerce = () => {};

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4/mini/external.js
var init_external = __esm(() => {
  init_core();
  init_locales();
  init_iso();
  init_coerce();
  init_parse();
  init_schemas();
  init_checks();
});

// node_modules/.bun/zod@4.3.6/node_modules/zod/v4-mini/index.js
var init_v4_mini = __esm(() => {
  init_external();
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function isZ4Schema(s) {
  const schema = s;
  return !!schema._zod;
}
function safeParse2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = safeParse(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = v3Schema.safeParse(data);
  return result;
}
function getObjectShape(schema) {
  if (!schema)
    return;
  let rawShape;
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    rawShape = v4Schema._zod?.def?.shape;
  } else {
    const v3Schema = schema;
    rawShape = v3Schema.shape;
  }
  if (!rawShape)
    return;
  if (typeof rawShape === "function") {
    try {
      return rawShape();
    } catch {
      return;
    }
  }
  return rawShape;
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def2 = v4Schema._zod?.def;
    if (def2) {
      if (def2.value !== undefined)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0) {
        return def2.values[0];
      }
    }
  }
  const v3Schema = schema;
  const def = v3Schema._def;
  if (def) {
    if (def.value !== undefined)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0) {
      return def.values[0];
    }
  }
  const directValue = schema.value;
  if (directValue !== undefined)
    return directValue;
  return;
}
var init_zod_compat = __esm(() => {
  init_v4_mini();
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}
var init_interfaces = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride;
var init_Options = __esm(() => {
  ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/Refs.js
var init_Refs = __esm(() => {
  init_Options();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
var init_errorMessages = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var init_getRelativePath = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
var init_any = __esm(() => {
  init_getRelativePath();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
var init_array = __esm(() => {
  init_errorMessages();
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
var init_bigint = __esm(() => {
  init_errorMessages();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
var init_boolean = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
var init_branded = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var init_catch = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
var init_date = __esm(() => {
  init_errorMessages();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
var init_default = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
var init_effects = __esm(() => {
  init_parseDef();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
var init_enum = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var init_intersection = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
var init_literal = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC;
var init_string = __esm(() => {
  init_errorMessages();
  ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
var init_record = __esm(() => {
  init_parseDef();
  init_string();
  init_branded();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
var init_map = __esm(() => {
  init_parseDef();
  init_record();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
var init_nativeEnum = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
var init_never = __esm(() => {
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
var init_null = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var init_union = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
var init_nullable = __esm(() => {
  init_parseDef();
  init_union();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
var init_number = __esm(() => {
  init_errorMessages();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
var init_object = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var init_optional = __esm(() => {
  init_parseDef();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var init_pipeline = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
var init_promise = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
var init_set = __esm(() => {
  init_errorMessages();
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
var init_tuple = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
var init_undefined = __esm(() => {
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
var init_unknown = __esm(() => {
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var init_readonly = __esm(() => {
  init_parseDef();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/selectParser.js
var init_selectParser = __esm(() => {
  init_any();
  init_array();
  init_bigint();
  init_boolean();
  init_branded();
  init_catch();
  init_date();
  init_default();
  init_effects();
  init_enum();
  init_intersection();
  init_literal();
  init_map();
  init_nativeEnum();
  init_never();
  init_null();
  init_nullable();
  init_number();
  init_object();
  init_optional();
  init_pipeline();
  init_promise();
  init_record();
  init_set();
  init_string();
  init_tuple();
  init_undefined();
  init_union();
  init_unknown();
  init_readonly();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parseDef.js
var init_parseDef = __esm(() => {
  init_Options();
  init_selectParser();
  init_getRelativePath();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/parseTypes.js
var init_parseTypes = () => {};

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var init_zodToJsonSchema = __esm(() => {
  init_parseDef();
  init_Refs();
  init_any();
});

// node_modules/.bun/zod-to-json-schema@3.25.2+3c5d820c62823f0b/node_modules/zod-to-json-schema/dist/esm/index.js
var init_esm = __esm(() => {
  init_zodToJsonSchema();
  init_Options();
  init_Refs();
  init_errorMessages();
  init_getRelativePath();
  init_parseDef();
  init_parseTypes();
  init_any();
  init_array();
  init_bigint();
  init_boolean();
  init_branded();
  init_catch();
  init_date();
  init_default();
  init_effects();
  init_enum();
  init_intersection();
  init_literal();
  init_map();
  init_nativeEnum();
  init_never();
  init_null();
  init_nullable();
  init_number();
  init_object();
  init_optional();
  init_pipeline();
  init_promise();
  init_readonly();
  init_record();
  init_set();
  init_string();
  init_tuple();
  init_undefined();
  init_union();
  init_unknown();
  init_selectParser();
  init_zodToJsonSchema();
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function getMethodLiteral(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value !== "string") {
    throw new Error("Schema method literal must be a string");
  }
  return value;
}
function parseWithCompat(schema, data) {
  const result = safeParse2(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}
var init_zod_json_schema_compat = __esm(() => {
  init_zod_compat();
  init_esm();
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
class Protocol {
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = new Map;
    this._requestHandlerAbortControllers = new Map;
    this._notificationHandlers = new Map;
    this._responseHandlers = new Map;
    this._progressHandlers = new Map;
    this._timeoutInfo = new Map;
    this._pendingDebouncedNotifications = new Set;
    this._taskProgressTokens = new Map;
    this._requestResolvers = new Map;
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(PingRequestSchema, (_request) => ({}));
    this._taskStore = _options?.taskStore;
    this._taskMessageQueue = _options?.taskMessageQueue;
    if (this._taskStore) {
      this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
        const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return {
          ...task
        };
      });
      this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
        const handleTaskResult = async () => {
          const taskId = request.params.taskId;
          if (this._taskMessageQueue) {
            let queuedMessage;
            while (queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId)) {
              if (queuedMessage.type === "response" || queuedMessage.type === "error") {
                const message = queuedMessage.message;
                const requestId = message.id;
                const resolver = this._requestResolvers.get(requestId);
                if (resolver) {
                  this._requestResolvers.delete(requestId);
                  if (queuedMessage.type === "response") {
                    resolver(message);
                  } else {
                    const errorMessage = message;
                    const error = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                    resolver(error);
                  }
                } else {
                  const messageType = queuedMessage.type === "response" ? "Response" : "Error";
                  this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
                }
                continue;
              }
              await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
            }
          }
          const task = await this._taskStore.getTask(taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
          }
          if (!isTerminal(task.status)) {
            await this._waitForTaskUpdate(taskId, extra.signal);
            return await handleTaskResult();
          }
          if (isTerminal(task.status)) {
            const result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
            this._clearTaskQueue(taskId);
            return {
              ...result,
              _meta: {
                ...result._meta,
                [RELATED_TASK_META_KEY]: {
                  taskId
                }
              }
            };
          }
          return await handleTaskResult();
        };
        return await handleTaskResult();
      });
      this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
        try {
          const { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
          return {
            tasks,
            nextCursor,
            _meta: {}
          };
        } catch (error) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
        try {
          const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
          }
          if (isTerminal(task.status)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
          }
          await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId);
          this._clearTaskQueue(request.params.taskId);
          const cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!cancelledTask) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
          }
          return {
            _meta: {},
            ...cancelledTask
          };
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
  }
  async _oncancel(notification) {
    if (!notification.params.requestId) {
      return;
    }
    const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
    controller?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  async connect(transport) {
    if (this._transport) {
      throw new Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
    }
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.();
      this._onclose();
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error) => {
      _onerror?.(error);
      this._onerror(error);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = new Map;
    this._progressHandlers.clear();
    this._taskProgressTokens.clear();
    this._pendingDebouncedNotifications.clear();
    for (const info of this._timeoutInfo.values()) {
      clearTimeout(info.timeoutId);
    }
    this._timeoutInfo.clear();
    for (const controller of this._requestHandlerAbortControllers.values()) {
      controller.abort();
    }
    this._requestHandlerAbortControllers.clear();
    const error = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = undefined;
    this.onclose?.();
    for (const handler of responseHandlers.values()) {
      handler(error);
    }
  }
  _onerror(error) {
    this.onerror?.(error);
  }
  _onnotification(notification) {
    const handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    if (handler === undefined) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
  }
  _onrequest(request, extra) {
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    const relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId;
    if (handler === undefined) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId).catch((error) => this._onerror(new Error(`Failed to enqueue error response: ${error}`)));
      } else {
        capturedTransport?.send(errorResponse).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
      }
      return;
    }
    const abortController = new AbortController;
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : undefined;
    const taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : undefined;
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        if (abortController.signal.aborted)
          return;
        const notificationOptions = { relatedRequestId: request.id };
        if (relatedTaskId) {
          notificationOptions.relatedTask = { taskId: relatedTaskId };
        }
        await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        if (abortController.signal.aborted) {
          throw new McpError(ErrorCode.ConnectionClosed, "Request was cancelled");
        }
        const requestOptions = { ...options, relatedRequestId: request.id };
        if (relatedTaskId && !requestOptions.relatedTask) {
          requestOptions.relatedTask = { taskId: relatedTaskId };
        }
        const effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        if (effectiveTaskId && taskStore) {
          await taskStore.updateTaskStatus(effectiveTaskId, "input_required");
        }
        return await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      if (taskCreationParams) {
        this.assertTaskHandlerCapability(request.method);
      }
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted) {
        return;
      }
      const response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "response",
          message: response,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(response);
      }
    }, async (error) => {
      if (abortController.signal.aborted) {
        return;
      }
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error["code"]) ? error["code"] : ErrorCode.InternalError,
          message: error.message ?? "Internal error",
          ...error["data"] !== undefined && { data: error["data"] }
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(errorResponse);
      }
    }).catch((error) => this._onerror(new Error(`Failed to send response: ${error}`))).finally(() => {
      if (this._requestHandlerAbortControllers.get(request.id) === abortController) {
        this._requestHandlerAbortControllers.delete(request.id);
      }
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error) {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        responseHandler(error);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      this._requestResolvers.delete(messageId);
      if (isJSONRPCResultResponse(response)) {
        resolver(response);
      } else {
        const error = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error);
      }
      return;
    }
    const handler = this._responseHandlers.get(messageId);
    if (handler === undefined) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    let isTaskResponse = false;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result === "object") {
      const result = response.result;
      if (result.task && typeof result.task === "object") {
        const task = result.task;
        if (typeof task.taskId === "string") {
          isTaskResponse = true;
          this._taskProgressTokens.set(task.taskId, messageId);
        }
      }
    }
    if (!isTaskResponse) {
      this._progressHandlers.delete(messageId);
    }
    if (isJSONRPCResultResponse(response)) {
      handler(response);
    } else {
      const error = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error);
    }
  }
  get transport() {
    return this._transport;
  }
  async close() {
    await this._transport?.close();
  }
  async* requestStream(request, resultSchema, options) {
    const { task } = options ?? {};
    if (!task) {
      try {
        const result = await this.request(request, resultSchema, options);
        yield { type: "result", result };
      } catch (error) {
        yield {
          type: "error",
          error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
        };
      }
      return;
    }
    let taskId;
    try {
      const createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task) {
        taskId = createResult.task.taskId;
        yield { type: "taskCreated", task: createResult.task };
      } else {
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      }
      while (true) {
        const task2 = await this.getTask({ taskId }, options);
        yield { type: "taskStatus", task: task2 };
        if (isTerminal(task2.status)) {
          if (task2.status === "completed") {
            const result = await this.getTaskResult({ taskId }, resultSchema, options);
            yield { type: "result", result };
          } else if (task2.status === "failed") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
            };
          } else if (task2.status === "cancelled") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
            };
          }
          return;
        }
        if (task2.status === "input_required") {
          const result = await this.getTaskResult({ taskId }, resultSchema, options);
          yield { type: "result", result };
          return;
        }
        const pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        options?.signal?.throwIfAborted();
      }
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
      };
    }
  }
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve, reject) => {
      const earlyReject = (error) => {
        reject(error);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) {
        try {
          this.assertCapabilityForMethod(request.method);
          if (task) {
            this.assertTaskCapability(request.method);
          }
        } catch (e) {
          earlyReject(e);
          return;
        }
      }
      options?.signal?.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta || {},
            progressToken: messageId
          }
        };
      }
      if (task) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          task
        };
      }
      if (relatedTask) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          _meta: {
            ...jsonrpcRequest.params?._meta || {},
            [RELATED_TASK_META_KEY]: relatedTask
          }
        };
      }
      const cancel = (reason) => {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => this._onerror(new Error(`Failed to send cancellation: ${error2}`)));
        const error = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const parseResult = safeParse2(resultSchema, response.result);
          if (!parseResult.success) {
            reject(parseResult.error);
          } else {
            resolve(parseResult.data);
          }
        } catch (error) {
          reject(error);
        }
      });
      options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      const relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        const responseResolver = (response) => {
          const handler = this._responseHandlers.get(messageId);
          if (handler) {
            handler(response);
          } else {
            this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
          }
        };
        this._requestResolvers.set(messageId, responseResolver);
        this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      } else {
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      }
    });
  }
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  async notification(notification, options) {
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      const jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    const debouncedMethods = this._options?.debouncedNotificationMethods ?? [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask;
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        if (options?.relatedTask) {
          jsonrpcNotification2 = {
            ...jsonrpcNotification2,
            params: {
              ...jsonrpcNotification2.params,
              _meta: {
                ...jsonrpcNotification2.params?._meta || {},
                [RELATED_TASK_META_KEY]: options.relatedTask
              }
            }
          };
        }
        this._transport?.send(jsonrpcNotification2, options).catch((error) => this._onerror(error));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    if (options?.relatedTask) {
      jsonrpcNotification = {
        ...jsonrpcNotification,
        params: {
          ...jsonrpcNotification.params,
          _meta: {
            ...jsonrpcNotification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  setRequestHandler(requestSchema, handler) {
    const method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      const parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  setNotificationHandler(notificationSchema, handler) {
    const method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      const parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  _cleanupTaskProgressHandler(taskId) {
    const progressToken = this._taskProgressTokens.get(taskId);
    if (progressToken !== undefined) {
      this._progressHandlers.delete(progressToken);
      this._taskProgressTokens.delete(taskId);
    }
  }
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue) {
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    }
    const maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId, maxQueueSize);
  }
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      const messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (const message of messages) {
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          const requestId = message.message.id;
          const resolver = this._requestResolvers.get(requestId);
          if (resolver) {
            resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed"));
            this._requestResolvers.delete(requestId);
          } else {
            this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
          }
        }
      }
    }
  }
  async _waitForTaskUpdate(taskId, signal) {
    let interval = this._options?.defaultTaskPollInterval ?? 1000;
    try {
      const task = await this._taskStore?.getTask(taskId);
      if (task?.pollInterval) {
        interval = task.pollInterval;
      }
    } catch {}
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      const timeoutId = setTimeout(resolve, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: true });
    });
  }
  requestTaskStore(request, sessionId) {
    const taskStore = this._taskStore;
    if (!taskStore) {
      throw new Error("No task store configured");
    }
    return {
      createTask: async (taskParams) => {
        if (!request) {
          throw new Error("No request provided");
        }
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        const task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification);
          if (isTerminal(task.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      getTaskResult: (taskId) => {
        return taskStore.getTaskResult(taskId, sessionId);
      },
      updateTaskStatus: async (taskId, status, statusMessage) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        }
        if (isTerminal(task.status)) {
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        }
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        const updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification);
          if (isTerminal(updatedTask.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      listTasks: (cursor) => {
        return taskStore.listTasks(cursor, sessionId);
      }
    };
  }
}
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === undefined)
      continue;
    const baseValue = result[k];
    if (isPlainObject(baseValue) && isPlainObject(addValue)) {
      result[k] = { ...baseValue, ...addValue };
    } else {
      result[k] = addValue;
    }
  }
  return result;
}
var DEFAULT_REQUEST_TIMEOUT_MSEC = 60000;
var init_protocol = __esm(() => {
  init_zod_compat();
  init_types();
  init_interfaces();
  init_zod_json_schema_compat();
});

// node_modules/.bun/ajv-formats@3.0.1/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatNames = exports.fastFormats = exports.fullFormats = undefined;
  function fmtDef(validate, compare) {
    return { validate, compare };
  }
  exports.fullFormats = {
    date: fmtDef(date2, compareDate),
    time: fmtDef(getTime(true), compareTime),
    "date-time": fmtDef(getDateTime(true), compareDateTime),
    "iso-time": fmtDef(getTime(), compareIsoTime),
    "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex,
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    byte,
    int32: { type: "number", validate: validateInt32 },
    int64: { type: "number", validate: validateInt64 },
    float: { type: "number", validate: validateNumber },
    double: { type: "number", validate: validateNumber },
    password: true,
    binary: true
  };
  exports.fastFormats = {
    ...exports.fullFormats,
    date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
    time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
    "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
    "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
    "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  };
  exports.formatNames = Object.keys(exports.fullFormats);
  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function date2(str) {
    const matches = DATE.exec(str);
    if (!matches)
      return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  }
  function compareDate(d1, d2) {
    if (!(d1 && d2))
      return;
    if (d1 > d2)
      return 1;
    if (d1 < d2)
      return -1;
    return 0;
  }
  var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function getTime(strictTimeZone) {
    return function time(str) {
      const matches = TIME.exec(str);
      if (!matches)
        return false;
      const hr = +matches[1];
      const min = +matches[2];
      const sec = +matches[3];
      const tz = matches[4];
      const tzSign = matches[5] === "-" ? -1 : 1;
      const tzH = +(matches[6] || 0);
      const tzM = +(matches[7] || 0);
      if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
        return false;
      if (hr <= 23 && min <= 59 && sec < 60)
        return true;
      const utcMin = min - tzM * tzSign;
      const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
      return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
    };
  }
  function compareTime(s1, s2) {
    if (!(s1 && s2))
      return;
    const t1 = new Date("2020-01-01T" + s1).valueOf();
    const t2 = new Date("2020-01-01T" + s2).valueOf();
    if (!(t1 && t2))
      return;
    return t1 - t2;
  }
  function compareIsoTime(t1, t2) {
    if (!(t1 && t2))
      return;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
      return;
    t1 = a1[1] + a1[2] + a1[3];
    t2 = a2[1] + a2[2] + a2[3];
    if (t1 > t2)
      return 1;
    if (t1 < t2)
      return -1;
    return 0;
  }
  var DATE_TIME_SEPARATOR = /t|\s/i;
  function getDateTime(strictTimeZone) {
    const time = getTime(strictTimeZone);
    return function date_time(str) {
      const dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length === 2 && date2(dateTime[0]) && time(dateTime[1]);
    };
  }
  function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const d1 = new Date(dt1).valueOf();
    const d2 = new Date(dt2).valueOf();
    if (!(d1 && d2))
      return;
    return d1 - d2;
  }
  function compareIsoDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
      return;
    return res || compareTime(t1, t2);
  }
  var NOT_URI_FRAGMENT = /\/|:/;
  var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function uri(str) {
    return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  }
  var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function byte(str) {
    BYTE.lastIndex = 0;
    return BYTE.test(str);
  }
  var MIN_INT32 = -(2 ** 31);
  var MAX_INT32 = 2 ** 31 - 1;
  function validateInt32(value) {
    return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  }
  function validateInt64(value) {
    return Number.isInteger(value);
  }
  function validateNumber() {
    return true;
  }
  var Z_ANCHOR = /[^\\]\\Z/;
  function regex(str) {
    if (Z_ANCHOR.test(str))
      return false;
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }
});

// node_modules/.bun/ajv-formats@3.0.1/node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatLimitDefinition = undefined;
  var ajv_1 = require_ajv();
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  exports.formatLimitDefinition = {
    keyword: Object.keys(KWDs),
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, keyword, it } = cxt;
      const { opts, self } = it;
      if (!opts.validateFormats)
        return;
      const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
      if (fCxt.$data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
        cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
      }
      function validateFormat() {
        const format = fCxt.schema;
        const fmtDef = self.formats[format];
        if (!fmtDef || fmtDef === true)
          return;
        if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
          throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
        }
        const fmt = gen.scopeValue("formats", {
          key: format,
          ref: fmtDef,
          code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : undefined
        });
        cxt.fail$data(compareCode(fmt));
      }
      function compareCode(fmt) {
        return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  var formatLimitPlugin = (ajv) => {
    ajv.addKeyword(exports.formatLimitDefinition);
    return ajv;
  };
  exports.default = formatLimitPlugin;
});

// node_modules/.bun/ajv-formats@3.0.1/node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var formats_1 = require_formats();
  var limit_1 = require_limit();
  var codegen_1 = require_codegen();
  var fullName = new codegen_1.Name("fullFormats");
  var fastName = new codegen_1.Name("fastFormats");
  var formatsPlugin = (ajv, opts = { keywords: true }) => {
    if (Array.isArray(opts)) {
      addFormats(ajv, opts, formats_1.fullFormats, fullName);
      return ajv;
    }
    const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
    const list = opts.formats || formats_1.formatNames;
    addFormats(ajv, list, formats, exportName);
    if (opts.keywords)
      (0, limit_1.default)(ajv);
    return ajv;
  };
  formatsPlugin.get = (name, mode = "full") => {
    const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
    const f = formats[name];
    if (!f)
      throw new Error(`Unknown format "${name}"`);
    return f;
  };
  function addFormats(ajv, list, fs, exportName) {
    var _a;
    var _b;
    (_a = (_b = ajv.opts.code).formats) !== null && _a !== undefined || (_b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`);
    for (const f of list)
      ajv.addFormat(f, fs[f]);
  }
  module.exports = exports = formatsPlugin;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = formatsPlugin;
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
function createDefaultAjvInstance() {
  const ajv = new import_ajv.default({
    strict: false,
    validateFormats: true,
    validateSchema: false,
    allErrors: true
  });
  const addFormats = import_ajv_formats.default;
  addFormats(ajv);
  return ajv;
}

class AjvJsonSchemaValidator {
  constructor(ajv) {
    this._ajv = ajv ?? createDefaultAjvInstance();
  }
  getValidator(schema) {
    const ajvValidator = "$id" in schema && typeof schema.$id === "string" ? this._ajv.getSchema(schema.$id) ?? this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => {
      const valid = ajvValidator(input);
      if (valid) {
        return {
          valid: true,
          data: input,
          errorMessage: undefined
        };
      } else {
        return {
          valid: false,
          data: undefined,
          errorMessage: this._ajv.errorsText(ajvValidator.errors)
        };
      }
    };
  }
}
var import_ajv, import_ajv_formats;
var init_ajv_provider = __esm(() => {
  import_ajv = __toESM(require_ajv(), 1);
  import_ajv_formats = __toESM(require_dist(), 1);
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/server.js
class ExperimentalServerTasks {
  constructor(_server) {
    this._server = _server;
  }
  requestStream(request, resultSchema, options) {
    return this._server.requestStream(request, resultSchema, options);
  }
  createMessageStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    if ((params.tools || params.toolChoice) && !clientCapabilities?.sampling?.tools) {
      throw new Error("Client does not support sampling tools capability.");
    }
    if (params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : undefined;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) {
          throw new Error("The last message must contain only tool_result content if any is present");
        }
        if (!hasPreviousToolUse) {
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
        }
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
        }
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params
    }, CreateMessageResultSchema, options);
  }
  elicitInputStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    const mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!clientCapabilities?.elicitation?.url) {
          throw new Error("Client does not support url elicitation.");
        }
        break;
      }
      case "form": {
        if (!clientCapabilities?.elicitation?.form) {
          throw new Error("Client does not support form elicitation.");
        }
        break;
      }
    }
    const normalizedParams = mode === "form" && params.mode === undefined ? { ...params, mode: "form" } : params;
    return this.requestStream({
      method: "elicitation/create",
      params: normalizedParams
    }, ElicitResultSchema, options);
  }
  async getTask(taskId, options) {
    return this._server.getTask({ taskId }, options);
  }
  async getTaskResult(taskId, resultSchema, options) {
    return this._server.getTaskResult({ taskId }, resultSchema, options);
  }
  async listTasks(cursor, options) {
    return this._server.listTasks(cursor ? { cursor } : undefined, options);
  }
  async cancelTask(taskId, options) {
    return this._server.cancelTask({ taskId }, options);
  }
}
var init_server = __esm(() => {
  init_types();
});

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/helpers.js
function assertToolsCallTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "tools/call":
      if (!requests.tools?.call) {
        throw new Error(`${entityName} does not support task creation for tools/call (required for ${method})`);
      }
      break;
    default:
      break;
  }
}
function assertClientRequestTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "sampling/createMessage":
      if (!requests.sampling?.createMessage) {
        throw new Error(`${entityName} does not support task creation for sampling/createMessage (required for ${method})`);
      }
      break;
    case "elicitation/create":
      if (!requests.elicitation?.create) {
        throw new Error(`${entityName} does not support task creation for elicitation/create (required for ${method})`);
      }
      break;
    default:
      break;
  }
}
var init_helpers = () => {};

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js
var Server;
var init_server2 = __esm(() => {
  init_protocol();
  init_types();
  init_ajv_provider();
  init_zod_compat();
  init_server();
  init_helpers();
  Server = class Server extends Protocol {
    constructor(_serverInfo, options) {
      super(options);
      this._serverInfo = _serverInfo;
      this._loggingLevels = new Map;
      this.LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));
      this.isMessageIgnored = (level, sessionId) => {
        const currentLevel = this._loggingLevels.get(sessionId);
        return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : false;
      };
      this._capabilities = options?.capabilities ?? {};
      this._instructions = options?.instructions;
      this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new AjvJsonSchemaValidator;
      this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
      this.setNotificationHandler(InitializedNotificationSchema, () => this.oninitialized?.());
      if (this._capabilities.logging) {
        this.setRequestHandler(SetLevelRequestSchema, async (request, extra) => {
          const transportSessionId = extra.sessionId || extra.requestInfo?.headers["mcp-session-id"] || undefined;
          const { level } = request.params;
          const parseResult = LoggingLevelSchema.safeParse(level);
          if (parseResult.success) {
            this._loggingLevels.set(transportSessionId, parseResult.data);
          }
          return {};
        });
      }
    }
    get experimental() {
      if (!this._experimental) {
        this._experimental = {
          tasks: new ExperimentalServerTasks(this)
        };
      }
      return this._experimental;
    }
    registerCapabilities(capabilities) {
      if (this.transport) {
        throw new Error("Cannot register capabilities after connecting to transport");
      }
      this._capabilities = mergeCapabilities(this._capabilities, capabilities);
    }
    setRequestHandler(requestSchema, handler) {
      const shape = getObjectShape(requestSchema);
      const methodSchema = shape?.method;
      if (!methodSchema) {
        throw new Error("Schema is missing a method literal");
      }
      let methodValue;
      if (isZ4Schema(methodSchema)) {
        const v4Schema = methodSchema;
        const v4Def = v4Schema._zod?.def;
        methodValue = v4Def?.value ?? v4Schema.value;
      } else {
        const v3Schema = methodSchema;
        const legacyDef = v3Schema._def;
        methodValue = legacyDef?.value ?? v3Schema.value;
      }
      if (typeof methodValue !== "string") {
        throw new Error("Schema method literal must be a string");
      }
      const method = methodValue;
      if (method === "tools/call") {
        const wrappedHandler = async (request, extra) => {
          const validatedRequest = safeParse2(CallToolRequestSchema, request);
          if (!validatedRequest.success) {
            const errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call request: ${errorMessage}`);
          }
          const { params } = validatedRequest.data;
          const result = await Promise.resolve(handler(request, extra));
          if (params.task) {
            const taskValidationResult = safeParse2(CreateTaskResultSchema, result);
            if (!taskValidationResult.success) {
              const errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
              throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
            }
            return taskValidationResult.data;
          }
          const validationResult = safeParse2(CallToolResultSchema, result);
          if (!validationResult.success) {
            const errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call result: ${errorMessage}`);
          }
          return validationResult.data;
        };
        return super.setRequestHandler(requestSchema, wrappedHandler);
      }
      return super.setRequestHandler(requestSchema, handler);
    }
    assertCapabilityForMethod(method) {
      switch (method) {
        case "sampling/createMessage":
          if (!this._clientCapabilities?.sampling) {
            throw new Error(`Client does not support sampling (required for ${method})`);
          }
          break;
        case "elicitation/create":
          if (!this._clientCapabilities?.elicitation) {
            throw new Error(`Client does not support elicitation (required for ${method})`);
          }
          break;
        case "roots/list":
          if (!this._clientCapabilities?.roots) {
            throw new Error(`Client does not support listing roots (required for ${method})`);
          }
          break;
        case "ping":
          break;
      }
    }
    assertNotificationCapability(method) {
      switch (method) {
        case "notifications/message":
          if (!this._capabilities.logging) {
            throw new Error(`Server does not support logging (required for ${method})`);
          }
          break;
        case "notifications/resources/updated":
        case "notifications/resources/list_changed":
          if (!this._capabilities.resources) {
            throw new Error(`Server does not support notifying about resources (required for ${method})`);
          }
          break;
        case "notifications/tools/list_changed":
          if (!this._capabilities.tools) {
            throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
          }
          break;
        case "notifications/prompts/list_changed":
          if (!this._capabilities.prompts) {
            throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
          }
          break;
        case "notifications/elicitation/complete":
          if (!this._clientCapabilities?.elicitation?.url) {
            throw new Error(`Client does not support URL elicitation (required for ${method})`);
          }
          break;
        case "notifications/cancelled":
          break;
        case "notifications/progress":
          break;
      }
    }
    assertRequestHandlerCapability(method) {
      if (!this._capabilities) {
        return;
      }
      switch (method) {
        case "completion/complete":
          if (!this._capabilities.completions) {
            throw new Error(`Server does not support completions (required for ${method})`);
          }
          break;
        case "logging/setLevel":
          if (!this._capabilities.logging) {
            throw new Error(`Server does not support logging (required for ${method})`);
          }
          break;
        case "prompts/get":
        case "prompts/list":
          if (!this._capabilities.prompts) {
            throw new Error(`Server does not support prompts (required for ${method})`);
          }
          break;
        case "resources/list":
        case "resources/templates/list":
        case "resources/read":
          if (!this._capabilities.resources) {
            throw new Error(`Server does not support resources (required for ${method})`);
          }
          break;
        case "tools/call":
        case "tools/list":
          if (!this._capabilities.tools) {
            throw new Error(`Server does not support tools (required for ${method})`);
          }
          break;
        case "tasks/get":
        case "tasks/list":
        case "tasks/result":
        case "tasks/cancel":
          if (!this._capabilities.tasks) {
            throw new Error(`Server does not support tasks capability (required for ${method})`);
          }
          break;
        case "ping":
        case "initialize":
          break;
      }
    }
    assertTaskCapability(method) {
      assertClientRequestTaskCapability(this._clientCapabilities?.tasks?.requests, method, "Client");
    }
    assertTaskHandlerCapability(method) {
      if (!this._capabilities) {
        return;
      }
      assertToolsCallTaskCapability(this._capabilities.tasks?.requests, method, "Server");
    }
    async _oninitialize(request) {
      const requestedVersion = request.params.protocolVersion;
      this._clientCapabilities = request.params.capabilities;
      this._clientVersion = request.params.clientInfo;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION;
      return {
        protocolVersion,
        capabilities: this.getCapabilities(),
        serverInfo: this._serverInfo,
        ...this._instructions && { instructions: this._instructions }
      };
    }
    getClientCapabilities() {
      return this._clientCapabilities;
    }
    getClientVersion() {
      return this._clientVersion;
    }
    getCapabilities() {
      return this._capabilities;
    }
    async ping() {
      return this.request({ method: "ping" }, EmptyResultSchema);
    }
    async createMessage(params, options) {
      if (params.tools || params.toolChoice) {
        if (!this._clientCapabilities?.sampling?.tools) {
          throw new Error("Client does not support sampling tools capability.");
        }
      }
      if (params.messages.length > 0) {
        const lastMessage = params.messages[params.messages.length - 1];
        const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
        const hasToolResults = lastContent.some((c) => c.type === "tool_result");
        const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : undefined;
        const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
        const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
        if (hasToolResults) {
          if (lastContent.some((c) => c.type !== "tool_result")) {
            throw new Error("The last message must contain only tool_result content if any is present");
          }
          if (!hasPreviousToolUse) {
            throw new Error("tool_result blocks are not matching any tool_use from the previous message");
          }
        }
        if (hasPreviousToolUse) {
          const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
          const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
          if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
            throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
          }
        }
      }
      if (params.tools) {
        return this.request({ method: "sampling/createMessage", params }, CreateMessageResultWithToolsSchema, options);
      }
      return this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
    }
    async elicitInput(params, options) {
      const mode = params.mode ?? "form";
      switch (mode) {
        case "url": {
          if (!this._clientCapabilities?.elicitation?.url) {
            throw new Error("Client does not support url elicitation.");
          }
          const urlParams = params;
          return this.request({ method: "elicitation/create", params: urlParams }, ElicitResultSchema, options);
        }
        case "form": {
          if (!this._clientCapabilities?.elicitation?.form) {
            throw new Error("Client does not support form elicitation.");
          }
          const formParams = params.mode === "form" ? params : { ...params, mode: "form" };
          const result = await this.request({ method: "elicitation/create", params: formParams }, ElicitResultSchema, options);
          if (result.action === "accept" && result.content && formParams.requestedSchema) {
            try {
              const validator = this._jsonSchemaValidator.getValidator(formParams.requestedSchema);
              const validationResult = validator(result.content);
              if (!validationResult.valid) {
                throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
              }
            } catch (error) {
              if (error instanceof McpError) {
                throw error;
              }
              throw new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          return result;
        }
      }
    }
    createElicitationCompletionNotifier(elicitationId, options) {
      if (!this._clientCapabilities?.elicitation?.url) {
        throw new Error("Client does not support URL elicitation (required for notifications/elicitation/complete)");
      }
      return () => this.notification({
        method: "notifications/elicitation/complete",
        params: {
          elicitationId
        }
      }, options);
    }
    async listRoots(params, options) {
      return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
    }
    async sendLoggingMessage(params, sessionId) {
      if (this._capabilities.logging) {
        if (!this.isMessageIgnored(params.level, sessionId)) {
          return this.notification({ method: "notifications/message", params });
        }
      }
    }
    async sendResourceUpdated(params) {
      return this.notification({
        method: "notifications/resources/updated",
        params
      });
    }
    async sendResourceListChanged() {
      return this.notification({
        method: "notifications/resources/list_changed"
      });
    }
    async sendToolListChanged() {
      return this.notification({ method: "notifications/tools/list_changed" });
    }
    async sendPromptListChanged() {
      return this.notification({ method: "notifications/prompts/list_changed" });
    }
  };
});

export { isZ4Schema, safeParse2 as safeParse, getObjectShape, init_zod_compat, LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS, isJSONRPCRequest, isJSONRPCResultResponse, ErrorCode, JSONRPCMessageSchema, EmptyResultSchema, InitializeResultSchema, isInitializedNotification, CreateTaskResultSchema, ListResourcesResultSchema, ListResourceTemplatesResultSchema, ReadResourceResultSchema, ResourceListChangedNotificationSchema, ListPromptsResultSchema, GetPromptResultSchema, PromptListChangedNotificationSchema, ListToolsRequestSchema, ListToolsResultSchema, CallToolResultSchema, CallToolRequestSchema, ToolListChangedNotificationSchema, ListChangedOptionsBaseSchema, CreateMessageRequestSchema, CreateMessageResultSchema, CreateMessageResultWithToolsSchema, ElicitRequestSchema, ElicitationCompleteNotificationSchema, ElicitResultSchema, CompleteResultSchema, ListRootsRequestSchema, McpError, init_types, Protocol, mergeCapabilities, init_protocol, AjvJsonSchemaValidator, init_ajv_provider, assertToolsCallTaskCapability, assertClientRequestTaskCapability, init_helpers, Server, init_server2 as init_server };

//# debugId=AEB4C132B89EDE6864756E2164756E21
//# sourceMappingURL=chunk-ym6j0wv1.js.map
