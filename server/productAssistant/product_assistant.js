const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const fetch = require('node-fetch');

console.log("api", process.env.CHAT_GPT_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API_KEY,
});


let assistantPromise, threadPromise, filePromises;



const cancelThreadRun = async (threadId, runId) => {
  try {
    await openai.beta.threads.runs.cancel(threadId, runId);
    console.log(`Successfully cancelled run ${runId} for thread ${threadId}`);
  } catch (error) {
    console.error(`Error cancelling run ${runId} for thread ${threadId}:`, error);
  }
};


const getProductDetail = async (pId) => {
  try {
    const response = await fetch(`http://localhost:7070/products/${pId}`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product details data:', error);
  }
}

const getProducts = async () => {
  try {
    const response = await fetch(`http://localhost:7070/products`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product details data:', error);
  }
}


const productApiFunction = {
  "type": "function",
  "function": {
      "name": "getProductDetail",
      "description": "Get the details of a product from a given product ID",
      "parameters": {
          "type": "object",
          "properties": {
              "pId": {
                  "type": "string",
                  "description": "The ID of the product to get the details for."
              }
          },
          "required": ["pId"]
      }
  }
}

const getProductsApiFunction = {
  "type": "function",
  "function": {
    "name": "getProducts",
    "description": "Get the list of all products",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
}

// Initialize assistant, thread, and files
function initializeAssistantAndThread() {
    assistantPromise = openai.beta.assistants.create({
        name: "ProSpector",
        instructions: `Welcome to ProSpector! As a ProSpector Assistant, your role is to provide insights and information specifically related to products identified by their product ID. Simply input the product ID along with your query to receive details such as product status, pricing, specifications, and related information only give answer whatever asked to you don't give extra answers. If you request all product details, please specify 'all products' in your query. Please refrain from asking unrelated questions, and keep your inquiries focused on product-related topics. Your responses should be clear, concise, and tailored to product inquiries. All responses should be provided in JSX format for seamless integration with React applications. Thank you for using ProSpector for your product-related needs! Remember not to answer any unrelated questions. If the question is related to product inquiry then answer it; otherwise, simply decline the question. give all response in jsx format with some basic styling using appropreate tags according to the user requirements this mandatory.`,
        model: "gpt-4-turbo-preview",
        tools: [{ type: "code_interpreter" },getProductsApiFunction, productApiFunction],
      });
      

  threadPromise = openai.beta.threads.create();

  console.log("Assistant and thread initialization in progress...");

  const filesToCreate = ["productdata.json"];
  if(filesToCreate.length > 0){
    filePromises = filesToCreate.map(fileName => {
      const filePath = path.join(__dirname, fileName); 
        return openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants",
        });
      });
    
      console.log("Files uploading started.");
  }else{
    filePromises = [];
    console.log('there is no files to upload.')
  }
  
}

initializeAssistantAndThread();

// Define a function to handle requests
const sendMessageToProSpectorAssistant = async (req, res) => {
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
      `Welcome to ProSpector! As a ProSpector Assistant, your role is to provide insights and information specifically related to products identified by their product ID. Simply input the product ID along with your query to receive details such as product status, pricing, specifications, and related information only give answer whatever asked to you don't give extra answers. If you request all product details, please specify 'all products' in your query. Please refrain from asking unrelated questions, and keep your inquiries focused on product-related topics. Your responses should be clear, concise, and tailored to product inquiries. All responses should be provided in JSX format for seamless integration with React applications. Thank you for using ProSpector for your product-related needs! Remember not to answer any unrelated questions. If the question is related to product inquiry then answer it; otherwise, simply decline the question. give all response in jsx format with some basic styling using appropreate tags according to the user requirements this mandatory.`,
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
            
            try{
              if (funcName === "getProductDetail") {
                const output = await getProductDetail(functionArguments.pId);
                if(output){
                  toolsOutput.push({
                      tool_call_id: action.id,
                      output: JSON.stringify(output)  
                  });
                }
                else{
                  throw "Internal server Error!!!!!!!!!!!!!"
                }
            } else if (funcName === "getProducts") {
                const output = await getProducts();
              if (output !== undefined) {
                toolsOutput.push({
                  tool_call_id: action.id,
                  output: JSON.stringify(output)
                });
                
              }else{
                throw "Internal server Error!!!!!!!!!!!!!"
              }
            } else {
              console.log("Function not found");
            }
            }catch (error) {
              console.error('Error while processing function:', error);
              await cancelThreadRun(thread.id, run.id);
              return res.json({ answer: "Assistant: Opps, Something went wrong." });
            }
          }
    
        // Submit the tool outputs to Assistant API
        await openai.beta.threads.runs.submitToolOutputs(
            thread.id,
            run.id,
            { tool_outputs: toolsOutput }
        );
      } else if(runStatus.status === "failed"){
        return res.json({ answer: "Assistant: Opps, Something went wrong." });
      }
      else {
        console.log("Waiting for the Assistant to process...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return res.json({ error: "An error occurred." });
  }
};

module.exports = {
    sendMessageToProSpectorAssistant,
};
