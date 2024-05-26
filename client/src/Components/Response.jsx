import React from "react";

const Response = ({chat}) => {

    const lines = chat.assistant.split("```");
    console.log("lines 1: ", lines[0])
    console.log("lines 2: ", lines[1])
    console.log("lines : " , lines)
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="outgoin w-fit max-w-[10rem] text-start p-2 self-end bg-[#145DA0] text-sm text-white rounded-md">
        {chat.user}
      </div>
      <div className="incoming w-fit max-w-[20rem] text-start text-sm p-2 self-start bg-[#EBEBEB] rounded-md overflow-x-scroll">
        {chat.loading ? (
          <l-dot-wave size="30" speed="1" color="#145DA0"></l-dot-wave>
        ) : (
            lines.map((line , index)=>{
                if(index === 1){
                    return <div dangerouslySetInnerHTML={{ __html: line.replace(/^\w+\s*/, '') }} />
                }else if(index === 0){
                    return line
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
