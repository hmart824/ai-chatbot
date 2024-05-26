import React, { useEffect, useState, useRef } from "react";
import { BsRobot } from "react-icons/bs";
import { HiArrowSmUp } from "react-icons/hi";
import { TiMessages } from "react-icons/ti";
import axios from "axios";
import { dotWave } from "ldrs";
import Response from "./Response";

dotWave.register();

// Default values shown

const Chatbot = () => {
  const chatBoxRef = useRef(null);
  const [showChatBox, setShowChatBox] = useState(false);
  const [inp, setInp] = useState("");
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    const scrollDelay = 100; // Adjust the delay time in milliseconds as needed

    // Check if chatBoxRef.current is not null
    if (chatBox) {
      // Scroll after a delay
      const scrollWithDelay = () => {
        setTimeout(() => {
          chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: "smooth",
          });
        }, scrollDelay);
      };

      // Call the scroll function after a delay whenever selectedGroup.chats changes
      scrollWithDelay();
    }
  }, [chats, chatBoxRef]);

  const onSubmit = async () => {
    if (!inp) {
      return;
    }
    const conversation = {
      id: chats.length + 1,
      user: inp,
      assistant: "",
      loading: true,
    };
    const modifiedChats = [...chats, conversation];
    setChats(modifiedChats);
    setInp("");
    const response = await axios.post("http://localhost:7070/chat", {
      content: inp,
    });
    console.log("response ----->>" , response)
    if (response) {
      console.log("^^^^^^^^^^^^^^", response);
      const tempChat = {
        ...conversation,
        assistant: response.data.answer
          .replace(/^[^\s]+|【[^【]*$/g, "")
          .trim(),
        loading: false,
      };
      const tempChats = modifiedChats.map((chat) => {
        if (chat.id === tempChat.id) {
          chat = tempChat;
          return chat;
        }
        return chat;
      });
      console.log("^^^^", tempChats);
      setChats(tempChats);
    }
  };

  return (
    <div className="absolute h-svh top-0 left-0 w-svw flex justify-end items-end flex-col gap-4 ">
      {showChatBox && (
        <div
          className={`h-[85vh]  w-[30vw] mr-8 bg-white relative rounded-md transition-transform ${
            showChatBox ? "translate-x-[0%]" : "translate-x-[111%]"
          } ease-out duration-300`}
        >
          <div className="w-full h-[4rem] flex items-center gap-3 p-4 border-b-2">
            <BsRobot className="w-12 h-12 p-1 text-white rounded-md bg-[#145DA0]" />
            <p className="flex flex-col items-start">
              <span className="text-base">I'm Qute a AI chat bot.</span>
              <span className="text-xs">
                Powered by <strong>Quotus</strong>
              </span>
            </p>
          </div>

          <div
            className=" w-full h-[73%] my-3 relative p-2 flex flex-col overflow-y-scroll gap-2 "
            ref={chatBoxRef}
          >
            <div className="incoming w-fit max-w-[20rem] text-start text-sm p-2 self-start bg-[#EBEBEB] rounded-md">
              Hi I'm Qute, How may i help you
            </div>
            {chats.map((chat, index) => {
              return (
                <Response key={index} chat={chat}/>
              );
            })}
          </div>

          <div className="absolute bottom-0 w-full h-12 flex items-center gap-4 border-t-2">
            <input
              type="text"
              className="outline-none w-[83%] px-2 py-1"
              name="content"
              placeholder="Ask me Anything...."
              value={inp}
              autoFocus
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? onSubmit() : null)}
            />
            <HiArrowSmUp
              className="text-2xl cursor-pointer"
              onClick={onSubmit}
            />
          </div>
        </div>
      )}
      <div
        className="mb-[.6rem] mr-8 text-white p-[.7rem] rounded-full ouline bg-[#145DA0] cursor-pointer"
        onClick={() => setShowChatBox(!showChatBox)}
      >
        <TiMessages className="text-3xl" />
      </div>
    </div>
  );
};

export default Chatbot;
