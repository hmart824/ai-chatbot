import React from "react";
import parse from 'html-react-parser';

const Response = ({chat}) => {

    const lines = chat.assistant.split("```");
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="outgoin w-fit max-w-full text-start p-2 self-end bg-[#145DA0] text-sm text-white rounded-md">
        {chat.user}
      </div>
      <div className="incoming w-fit max-w-full text-start text-sm p-2 self-start bg-[#EBEBEB] rounded-md overflow-x-scroll">
        {chat.loading ? (
          <l-dot-wave size="30" speed="1" color="#145DA0"></l-dot-wave>
        ) : (
            lines.map((line , index)=>{
                if(index === 1){
                    return <div key={index}>{parse(line.replace(/^\w+\s*/, ''))}</div>
                }else if(index === 0){
                    return <div key={index}>{parse(line)}</div>
                }else{
                    return null
                }
            })
          
        )}
      </div>
    </div>
  );
};

export default Response;
