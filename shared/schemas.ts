export type TextMessagePayload = {
  timestamp: number;
  message: string;
};

export const TextMessagePayloadSchema = {
  timestamp: "number",
  message: "string",
};

export type MessageType = "textMessage";

export type MessageSchema = Record<string, string | number | boolean | null>;
export type MessagePayload = TextMessagePayload;

export type RawMessage = {
  type: "textMessage";
  payload: TextMessagePayload;
};

export const SCHEMAS = {
  textMessage: TextMessagePayloadSchema,
} satisfies Record<MessageType, Record<string, any>>;

export function getSchema(type: MessageType): MessageSchema | null {
  return SCHEMAS[type] || null;
}
