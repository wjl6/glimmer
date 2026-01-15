import { ChatOpenAI } from "@langchain/openai";

const defaultModel = process.env.LLM_MODEL || "gpt-4.1-mini";
const baseUrl = process.env.LLM_BASE_URL;
const apiKey = process.env.LLM_API_KEY;

function createModel() {
  if (!apiKey) {
    return null;
  }

  return new ChatOpenAI({
    model: defaultModel,
    apiKey,
    timeout: 30000,
    configuration: {
      baseURL: baseUrl,
    },
  });
}

const textModel = createModel();

export async function generateEncouragement(mood: string): Promise<string> {
  const prompt = `
你是一名温柔、克制的安慰者，只输出一句非常简短的中文鼓励话语。

当前用户心情: ${mood}

要求:
- 只输出一句话
- 不超过 30 个汉字
- 不使用感叹号
- 不出现 Emoji
- 语气平实、温和、不过度积极
`;

  console.log("LLM config", {
    hasApiKey: !!apiKey,
    model: defaultModel,
    baseUrl,
  });

  if (!textModel) {
    console.log("LLM not available, using default")
    return generateDefaultEncouragement(mood);
  }

  try {
    const message = await textModel.invoke(
      [
        ["system", "你是一个只会用简短中文鼓励用户的助手。"],
        ["user", prompt],
      ]
    );

    console.log("LLM result", message)

    const text = message.content?.toString().trim() || "";

    if (!text) {
      return generateDefaultEncouragement(mood);
    }

    return text.replace(/\s+/g, " ");
  } catch(error) {

    console.log("error:" , error)

    return generateDefaultEncouragement(mood);
  }
}

function generateDefaultEncouragement(mood: string): string {
  if (mood === "思考") {
    return "慢慢来就好，给自己一点时间整理思绪。";
  }

  if (mood === "疲惫") {
    return "你已经很努力了，允许自己好好休息一下。";
  }

  if (mood === "悲伤") {
    return "难过也是生活的一部分，你不必一个人扛。";
  }

  return "今天不必太勉强自己，按自己的节奏就好。";
}

