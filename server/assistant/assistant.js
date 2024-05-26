const OpenAI = require("openai");
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API_KEY,
});

//data analyst assistant.

const sendMessageToAssistant = async(req , res)=>{
  console.log('called');
    const {content} = req.body;
    
      try {
        
        const assistant = await openai.beta.assistants.create({
          name: "Data Analyst Assistant",
          instructions:
          "As a Data Analyst Assistant, your role is to analyze the uploaded file thoroughly and provide satisfactory results based on your understanding. If a user asks a question that isn't addressed in the uploaded file or is irrelevant, refrain from providing an answer. Keep your responses simple and concise, and if necessary, summarize lengthy answers to the best of your knowledge. You don't know anything if the question is not related to the uploded file. You only answer the question that is related to the uploaded file. You don't know coding . You don't know any coding laguage. You are just a Data analytist bot. Don't give the information about anything in the uploaded file if the question is not relevant.",
          model: "gpt-3.5-turbo",
          tools: [{ type: "retrieval" }],
        });
        console.log('assistant created successfully.');
        
        const thread = await openai.beta.threads.create();
        console.log('thread created successfully.');
        
        const filesToCreate = ['data.txt', 'data2.json']; 

        const fileIds = [];


        for (const filePath of filesToCreate) {
            const file = await openai.files.create({
                file: fs.createReadStream(filePath),
                purpose: "assistants",
            });
            console.log("Created file:", file);
            fileIds.push(file.id);
        }

        console.log('file uploading started.')
        // Update the assistant with all the file IDs
        await openai.beta.assistants.update(assistant.id, {
            file_ids: fileIds
        });

        console.log('file uploaded and updated in openai')
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: content,
        });
        
        console.log('thread run started')
        // Step 5: Run the Assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant.id,
          instructions:
          "As a Data Analyst Assistant, your role is to analyze the uploaded file thoroughly and provide satisfactory results based on your understanding. If a user asks a question that isn't addressed in the uploaded file or is irrelevant, refrain from providing an answer. Keep your responses simple and concise, and if necessary, summarize lengthy answers to the best of your knowledge. You don't know anything if the question is not related to the uploded file. You only answer the question that is related to the uploaded file. You don't know coding . You don't know any coding laguage. You are just a Data analytist bot. Don't give the information about anything in the uploaded file if the question is not relevant.",
        });
    
        console.log(run);
    
        while (true) {
          // Wait for 5 seconds
          await new Promise((resolve) => setTimeout(resolve, 5000));
    
          // Retrieve the run status
          const runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          console.log(runStatus);
    
          // If run is completed, get messages
          if (runStatus.status === "completed") {
            let messages = await openai.beta.threads.messages.list(thread.id);
    
            // Loop through messages and print content based on role
            messages = messages.data.map((msg) => {
              const role = msg.role;
              const content = msg.content[0].text.value;
              return `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`;
            });
            console.log(messages);
            res.json({answer: messages[0]});
            break;
          } else {
            console.log("Waiting for the Assistant to process...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      } catch (error) {
        console.error("Error:", error);
      }
}

module.exports = {
    sendMessageToAssistant
};

