const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const fetch = require('node-fetch');

console.log("api", process.env.CHAT_GPT_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API_KEY,
});


let assistantPromise, threadPromise, filePromises;

const getWeather = async (city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=Metric&appid=a4c0c6c151516dab3003754a24c6dcb4`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}


const weatherApiFunction = {
  "type": "function",
  "function": {
      "name": "getWeather",
      "description": "Get the current weather of given city",
      "parameters": {
          "type": "object",
          "properties": {
              "city": {
                  "type": "string",
                  "description": "The name of the city to get the weather for."
              }
          },
          "required": ["city"]
      }
  }
}

// Initialize assistant, thread, and files
function initializeAssistantAndThread() {
  assistantPromise = openai.beta.assistants.create({
    name: "Data Analyst Assistant",
    instructions:
      "As a Weather and Seasons Assistant, your role is to provide insights and information specifically related to weather patterns, seasonal changes, and meteorological data. You are specialized in weather and seasons data analysis. If a user asks a question unrelated to weather or seasons, refrain from providing an answer. Keep your responses simple, concise, and focused on weather-related topics. You do not possess knowledge beyond weather and seasons analysis. You do not engage in coding or programming tasks. Your responses should be based solely on weather and seasons data available. If the requested information is not found in the uploaded files, please refrain from providing an answer. Please provide accurate and relevant information tailored to weather and seasonal inquiries.",
    model: "gpt-4-turbo-preview",
    tools: [{ type: "retrieval" } , weatherApiFunction],
  });

  threadPromise = openai.beta.threads.create();

  console.log("Assistant and thread initialization in progress...");

  const filesToCreate = ["seasonsdata.txt"];
  filePromises = filesToCreate.map(filePath => {
    return openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
  });

  console.log("Files uploading started.");
  
}

initializeAssistantAndThread();

// Define a function to handle requests
const sendMessageToWeatherAssistant = async (req, res) => {
  console.log("called");
  const { content } = req.body;

  try {
    console.log('promises reosolving started.')
    // Wait for assistant, thread, and file initialization to complete
    await Promise.all([assistantPromise, threadPromise, ...filePromises]);

    const [assistant, thread, ...files] = await Promise.all([
      assistantPromise,
      threadPromise,
      ...filePromises
    ]);
    console.log('All promises resolved.')

    const fileIds = files.map(file => file.id);

    await openai.beta.assistants.update(assistant.id, {
      file_ids: fileIds,
    });

    console.log('Files are updated.')

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: content,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      instructions:
        "As a Weather and Seasons Assistant, your role is to provide insights and information specifically related to weather patterns, seasonal changes, and meteorological data. You are specialized in weather and seasons data analysis. If a user asks a question unrelated to weather or seasons, refrain from providing an answer. Keep your responses simple, concise, and focused on weather-related topics. You do not possess knowledge beyond weather and seasons analysis. You do not engage in coding or programming tasks. Your responses should be based solely on weather and seasons data available. If the requested information is not found in the uploaded files, please refrain from providing an answer. Please provide accurate and relevant information tailored to weather and seasonal inquiries.",
    });

    console.log(run);

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      console.log(runStatus);

      if (runStatus.status === "completed") {
        let messages = await openai.beta.threads.messages.list(thread.id);

        messages = messages.data.map((msg) => {
          const role = msg.role;
          const content = msg.content[0].text.value;
          return `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`;
        });

        console.log(messages);
        return res.json({ answer: messages[0] });
      }else if(runStatus.status === "requires_action"){
        console.log("Requires action");
    
        const requiredActions = runStatus.required_action.submit_tool_outputs.tool_calls;
        console.log(requiredActions);

        let toolsOutput = [];
    
        for (const action of requiredActions) {
            const funcName = action.function.name;
            const functionArguments = JSON.parse(action.function.arguments);
            
            if (funcName === "getWeather") {
                const output = await getWeather(functionArguments.city);
                console.log('^&^&^&^&^&^&^^&&&^' , output)
                if(output){
                  toolsOutput.push({
                      tool_call_id: action.id,
                      output: JSON.stringify(output)  
                  });
                }
            } else {
                console.log("Function not found");
            }
        }
    
        // Submit the tool outputs to Assistant API
        await openai.beta.threads.runs.submitToolOutputs(
            thread.id,
            run.id,
            { tool_outputs: toolsOutput }
        );
      } 
      else {
        console.log("Waiting for the Assistant to process...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};

module.exports = {
  sendMessageToWeatherAssistant,
};
