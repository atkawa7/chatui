import React from 'react';
import './App.css';
import Modal from 'react-modal';

import {
    Button,
    ChatContainer,
    MainContainer,
    Message,
    MessageInput,
    MessageList,
    Sidebar
} from "@chatscope/chat-ui-kit-react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFile} from "@fortawesome/free-solid-svg-icons";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "skeleton-css/css/skeleton.css";
import "skeleton-css/css/normalize.css";

Modal.setAppElement("#root");

const channels = [
    {
        "displayName": "Debug",
        "key": "debug"
    }, {
        "displayName": "Whatsapp",
        "key": "whatsapp"
    }
];


export const toEmoji = (str: string) =>{
    if (str === undefined || str === null || str === '') {
        return str;
    }

    if (str === '10') {
        return '🔟';
    }

    return str
        .replace(/0/g, '0️⃣')
        .replace(/1/g, '1️⃣')
        .replace(/2/g, '2️⃣')
        .replace(/3/g, '3️⃣')
        .replace(/4/g, '4️⃣')
        .replace(/5/g, '5️⃣')
        .replace(/6/g, '6️⃣')
        .replace(/7/g, '7️⃣')
        .replace(/8/g, '8️⃣')
        .replace(/9/g, '9️⃣');
}


export interface ChannelConversation {
    id?: number;
    channel: string;
    message?: string;
    session: string;
    user: string;
    direction?: string;
    sessionState?: string;

}

interface ChannelUser {
    channel: string;
    user: string;
}

interface AttachmentData {
    data: string;
    caption: string;
    contentType: string;
    filename: string;
    size: number;
}

const url = "http://localhost:8080";


function App() {
    const inputFile = React.useRef<HTMLInputElement>(null);
    const [conversationData, setConversationData] = React.useState<ChannelConversation[]>([]);
    const [modalIsOpen, setModalIsOpen] = React.useState(false);
    const [userData, setUserData] = React.useState<ChannelUser>({
        user: "",
        channel: ""
    });


    const handleInputChange = (e: any) => {
        const {name, value} = e.target;
        setUserData({...userData, [name]: value});
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setModalIsOpen(false);
        await fetchConversation(userData);
    };

    async function fetchConversation(channelUser: ChannelUser) {
        try {
            const response = await fetch(`${url}/webhooks/conversations?channel=${channelUser.channel}&user=${channelUser.user}`);
            if( response.ok){
                const data = await response.json();
                setConversationData(data);
            }

        } catch (e) {
        }
    }
    async function postConversation(channelUser: ChannelUser, text: string) {
        try {
            const response = await fetch(`${url}/webhooks/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "message": {
                        "type": "text",
                        "text": text.replace("<br>", "")
                    },
                    "channel": channelUser.channel,
                    "session": `${channelUser.user}-${channelUser.channel}`,
                    "user": channelUser.user,

                })
            });
        } catch (e) {
        }
    }
    async function postUpload(channelUser: ChannelUser, attachment: AttachmentData) {
        try {
            const response = await fetch(`${url}/webhooks/debug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "message": {attachment: attachment, "type": "attachment"},
                    "channel": channelUser.channel,
                    "session": `${channelUser.user}-${channelUser.channel}`,
                    "user": channelUser.user,

                })
            });
        } catch (e) {
        }
    }

    async function postAndFetch(channelData: ChannelUser, message: string){
        const current : ChannelConversation = {
            id: conversationData.length + 1,
            channel: channelData.channel,
            message: JSON.stringify({type: "text", text: message}),
            session: channelData.user,
            user: channelData.user,
            direction: "OUTGOING",
            sessionState: "con"
        }
        setConversationData([...conversationData, current]);
        await postConversation(channelData, message);
        await fetchConversation(channelData);
    }

    async function postAndUploadFile(channelData: ChannelUser, attachment: AttachmentData){
        const current : ChannelConversation = {
            id: conversationData.length + 1,
            channel: channelData.channel,
            message: JSON.stringify( {attachment, "type": "attachment"}),
            session: channelData.user,
            user: channelData.user,
            direction: "OUTGOING",
            sessionState: "con"
        }
        setConversationData([...conversationData, current]);
        await postUpload(channelData, attachment);
        await fetchConversation(channelData);
    }


    const MessageListComponents = conversationData.map((conversation) => {
        const message   = conversation.message? JSON.parse(conversation.message): {};
        if( message.type == 'text'){
            return <
                Message key={conversation.id}  model={
                {
                    message: message.text,
                    sentTime: "just now",
                    sender: "Bot",
                    direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                    position: "single"
                }
            }
            />
        }
        if( message.type == "choices"){
            const  html = [];
            html.push(message.text);
            html.push("\n");
            for(const choice of message.choices){
                html.push(toEmoji(choice.name));
                html.push(" ");
                html.push(choice.text);
                html.push("\n");
            }
            return <
                Message key={conversation.id}  model={
                {
                    message: html.join(""),
                    sentTime: "just now",
                    sender: "Bot",
                    direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                    position: "single"
                }
            }
            />
        }

        //{"filename":"Impilo EHR v 1.2.26 User Guide.pdf","id":"529168519452088","type":"file"}


        if(message.type ==='file'){
             return <
                Message key={conversation.id}  model={{
                message: conversation.message,
                payload:
                    <Message.CustomContent>
                        <FontAwesomeIcon height={30} width={30} icon={faFile} />
                        <br/>
                        <i>{message.filename}</i>
                        <br/>

                    </Message.CustomContent>,
                sentTime: "just now",
                sender: "Bot",
                direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                position: "single"
            }
            }
            />
        }

        //{"no":"No","text":"One of our Helpdesk operators will get in touch with you shortly on +263123456789. Confirm you are using this number for calls Y/N","type":"yes-or-no","yes":"Yes"}

        if(message.type ==='yes-or-no'){
            return <
                Message key={conversation.id} model={
                {
                    message: conversation.message,
                    payload: <Message.CustomContent>

                        <br/>
                        {message.text}
                        <br/>
                        <Button style={{ color: "black", background: "white" }} onClick={()=>{
                            postAndFetch(userData,"yes").then(()=>{}).catch(e=>{
                                console.log(e);
                            })
                        }}>
                            {message.yes}
                        </Button>
                        <Button style={{ color: "black", background: "white" }} onClick={()=>{
                            postAndFetch(userData, "no").then(()=>{}).catch(e=>{
                                console.log(e);
                            })
                        }}>
                            {message.no}
                        </Button>
                    </Message.CustomContent>,
                    sentTime: "just now",
                    sender: "Bot",
                    direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                    position: "single"
                }
            }
            />
        }

        if( message.type  =='attachment' && message.attachment){
            return <
                Message key={conversation.id}  model={{
                message: conversation.message,
                payload:
                    <Message.CustomContent>
                        <FontAwesomeIcon height={30} width={30} icon={faFile} />    {message.attachment.contentType}
                        <br/>
                        <i>{message.attachment.filename}</i>
                        <br/>
                    </Message.CustomContent>,
                sentTime: "just now",
                sender: "Bot",
                direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                position: "single"
            }
            }
            />
        }
        if( message.type == "raw" && message.raw){

            if( message.channel ==='whatsapp' && message.raw.action && message.raw.action.buttons){
                const raw = message.raw;
                const buttons =  message.raw.action.buttons.map((button: any)=>{
                    if( button.type ==='reply') {
                        return(<Button style={{ color: "black", background: "white" }} onClick={()=>{
                            postAndFetch(userData, button.reply.id).then(()=>{}).catch(e=>{
                                console.log(e);
                            })
                        }} key={button.reply.id}>
                            {button.reply.title}
                        </Button>);
                    }
                    return <div>Unknown Message</div>
                })
                return <
                    Message key={conversation.id} model={
                    {
                        message: conversation.message,
                        payload: <Message.CustomContent>
                            <Message.ImageContent src={raw.header.image.link} height={30} width={30}/>
                            <br/>
                            {raw.body.text}
                            <br/>
                            {buttons}
                        </Message.CustomContent>,
                        sentTime: "just now",
                        sender: "Bot",
                        direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                        position: "single"
                    }
                }
                />
            }
            return <
                Message key={conversation.id}  model={{
                    message: conversation.message,
                    payload: <Message.CustomContent>Custom content {conversation.message}</Message.CustomContent>,
                    sentTime: "just now",
                    sender: "Bot",
                    direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                    position: "single"
                }
            }
            />
        }
       return <
            Message key={conversation.id}  model={
            {
                message: conversation.message,
                sentTime: "just now",
                sender: "Bot",
                direction: (conversation.direction === 'INCOMING'? 'incoming': 'outgoing'),
                position: "single"
            }
        }
        />

    });
    // const ConversationComponents = channels.map((channel) => <
    //     Conversation key={channel.key} onClick={() => {
    //     console.log({selected: channel.key})
    // }} name={channel.displayName} lastSenderName={"Bot"} info={"Online"}
    // >
    //     <Avatar
    //         name={channel.displayName}
    //         src="https://chatscope.io/storybook/react/assets/eliot-JNkqSAth.svg"
    //         status="available"
    //     />
    // </Conversation>);



    return (
        <>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="Login"
                style={{
                    overlay: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1000, // Ensure overlay is above other elements
                    },
                    content: {
                        maxWidth: "500px",
                        margin: "auto",
                        padding: "20px",
                        borderRadius: "10px",
                        zIndex: 1001, // Ensure content is above the overlay
                    },
                }}
            >
                <h2>Set User Information</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>
                            User:
                            <input
                                type="text"
                                name="user"
                                value={userData.user}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                    </div>
                    <div>
                        <label>
                            Channel:
                            <select
                                className="custom-select"
                                name="channel"
                                value={userData.channel}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="" disabled>
                                    Select an option
                                </option>
                                {channels.map((channel) => (
                                    <option key={channel.key} value={channel.key}>
                                        {channel.displayName}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div style={{marginTop: "20px"}}>
                        <Button type="submit">Submit</Button>
                        <Button
                            type="button"
                            onClick={() => setModalIsOpen(false)}
                            style={{marginLeft: "10px"}}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            <div style={{position: "relative", height: "500px"}}>
                <input type='file' id='file' ref={inputFile} style={{display: 'none'}}/>
                <MainContainer>
                    <Sidebar
                        position="left"
                    >
                        <Button
                            onClick={() => setModalIsOpen(true)}>
                            {userData.user !== "" ? userData.user : "Login"}
                        </Button>
                    </Sidebar>
                    <ChatContainer>
                        <MessageList>{MessageListComponents}</MessageList>
                        <MessageInput
                            placeholder="Type message here"
                            onAttachClick={() => {
                                inputFile.current?.click();
                            }}
                            onSend={(message) => {
                                if (inputFile.current && inputFile.current.files && inputFile.current.files.length > 0) {
                                    const file = inputFile.current.files[0];
                                    const reader = new FileReader();
                                    reader.onload = function (e: any) {
                                        const content = e.target.result;

                                        postAndUploadFile(userData, {
                                            data: content,
                                            caption: message,
                                            filename: file.name,
                                            contentType: file.type,
                                            size: file.size
                                        }).then(() => {
                                            if (inputFile.current) {
                                                inputFile.current.value = ''
                                            }
                                        }).catch(e => {
                                            console.log(e);
                                        })

                                    };
                                    reader.onerror = function (e: any) {
                                        console.error("Error reading file", e.target.error);
                                    };
                                    reader.readAsDataURL(file);
                                } else {
                                    postAndFetch(userData, message).then(()=>{}).catch(e=>{
                                        console.log(e);
                                    })
                                }


                            }}

                        />
                    </ChatContainer>
                </MainContainer>
            </div>
        </>
    );
}

export default App;
