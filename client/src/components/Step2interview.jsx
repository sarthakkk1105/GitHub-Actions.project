import React, { useEffect, useRef, useState } from "react";
import maleVideo from "../assests/male-ai.mp4";
import femaleVideo from "../assests/female-ai.mp4";
import Timer from "./timer";
import { motion } from "motion/react";
import { FaMicrophone,FaMicrophoneSlash } from "react-icons/fa";
import axios from "axios";
import { ServerUrl } from "../App";
import { BsArrowLeft } from "react-icons/bs";
import { FaSignOutAlt } from "react-icons/fa";



const Step2interview = ({ interviewData, onFinish }) => {
  const { interviewId, questions, userName } = interviewData;
 

  

  const [isMicon ,setMicon] = useState(true)
  const recognitionRef = useRef(null)
  const [isAIPlaying, setIsAIPlaying]  =useState(false)

  const saved = JSON.parse(localStorage.getItem("interviewProgress") || "{}");

const [currentIndex, setCurrentIndex] = useState(
    saved.currentIndex ?? 0
);

const [answer, setAnswer] = useState(
    saved.answer ?? ""
);

const [feedback, setFeedback] = useState(
    saved.feedback ?? ""
);

const [timeleft, setTimeLeft] = useState(
    saved.timeleft ?? questions[0]?.timeLimit ?? 60
);

const [isIntrophase, setIntrophase] = useState(
    saved.currentIndex != null ? false : true
);

  const [selectedvoice,setselectedvoice] = useState(null)
  const [isSubmitting,setIsSubmitting] = useState(false)
  const [voiceGender,setVoicegender] = useState("female")
  const [subtittle , setsubtittle] = useState("")
  const [timerRunning, setTimerRunning] = useState(false); 
  
  const videoRef = useRef(null)

  const currentQuestion = questions[currentIndex]

  useEffect(()=>{
    const loadVoices = ()=>{

     
      const voices = window.speechSynthesis.getVoices()
      console.log(voices)
      if(!voices.length) return


      const femaleVoice = voices.find(v=>{
        return (v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female"))

      })

      if(femaleVoice){
        setselectedvoice(femaleVoice)
        setVoicegender("female")
        return
      }

      const malevoice = voices.find(v=>{
      return (v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male") )
      })

      if(malevoice){
        setselectedvoice(malevoice)
        setVoicegender("male")
        return
      }

      setselectedvoice(voices[0])
      setVoicegender("female")
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

  },[])

  const voiceSource = voiceGender === "male" ? maleVideo : femaleVideo;

  const speakText = (text) =>{
    return new Promise((resolve)=>{
      if(!window.speechSynthesis || !selectedvoice){
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const humantext = text.replace(/,/g,", ... ").replace(/\./g, ". ... ")

      const utterance = new SpeechSynthesisUtterance(humantext)

      utterance.voice = selectedvoice


      utterance.rate = 0.92
      utterance.pitch = 1.05
      utterance.volume = 1

      utterance.onstart = ()=>{
        setTimerRunning(false);

        setIsAIPlaying(true)
        stopMic()
        setsubtittle(text)
        videoRef.current?.play()

      }

      utterance.onend = ()=>{
        videoRef.current?.pause()
        if(videoRef.current){
          videoRef.current.currentTime = 0
        }
        setIsAIPlaying(false)

        if (!isIntrophase && currentQuestion) {
        setTimeLeft(currentQuestion.timeLimit || 60);
        setTimerRunning(true);
    }

        if(isMicon){
          startMic()
        }

        setTimeout(() => {
          setsubtittle("")
          resolve()
          
        }, 300);

        

        
        

      }
      window.speechSynthesis.speak(utterance)


    })
  }

  useEffect(()=>{

    
    if(!selectedvoice ){
      return
    }
    const runintro = async()=>{
      if(isIntrophase){
        await speakText(`
          hii ${userName} ,its greate to meet you today. i hope you're feeling confident and ready.
          `)

          await speakText(`
            I will ask you a few questions. just answer naturally,and take your time. lets begin.
            `)

            setIntrophase(false)

            
      }else if(currentQuestion){
        await new Promise(r=> setTimeout(r,800))
         console.log("Speaking question:", currentQuestion.question);
        if(currentIndex === questions.length -1){
          await speakText("Alright, this one might be a bit more challenging.")
        }


        await speakText(currentQuestion.question)

        if(isMicon){
          startMic()
        }
      }

      
    }
    runintro()


  },[selectedvoice,isIntrophase,currentIndex])

//   useEffect(() => {
//   if (isIntrophase) return;
//   if (!currentQuestion) return;
  

//   const timer = setInterval(() => {
//     setTimeLeft((prev) => {
//       if (prev <= 1) {
//         clearInterval(timer);
//         return 0;
//       }

//       return prev - 1;
//     });
//   }, 1000);

//   return () => clearInterval(timer);
// }, [isIntrophase, currentIndex , isSubmitting]);

useEffect(() => {

    if (!timerRunning) return;
    console.log("Timer Started", timeleft);

    const timer = setInterval(() => {

        setTimeLeft(prev => {
          console.log("Tick", prev);

            if (prev <= 1) {

                clearInterval(timer);
                setTimerRunning(false);
                return 0;

            }

            return prev - 1;

        });

    }, 1000);

    return () => clearInterval(timer);

}, [timerRunning]);

useEffect(()=>{
  if(!isIntrophase && currentQuestion){
    setTimeLeft(currentQuestion.timeLimit || 60)
  }
},[currentIndex])
  console.log(timeleft)
  
  useEffect(()=>{
    if(!("webkitSpeechRecognition" in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true;
    recognition.interimResults = false

    recognition.onresult = (event) =>{
      const transcript = event.results[event.results.length - 1][0].transcript;

      setAnswer((prev)=> prev + " " + transcript)
    }
    recognitionRef.current = recognition

  },[])

  const startMic = ()=>{
    if(recognitionRef.current && !isAIPlaying){
      try {
        recognitionRef.current.start()
      } catch (error) {
        
      }
    }
  }

  const stopMic = ()=>{
    if(recognitionRef.current){
      recognitionRef.current.stop()
    }
  }

  const toggleMic = ()=>{
    if(isMicon){
      stopMic()
    }else{
      startMic()
    }
    setMicon(!isMicon)
  }

  const submitAnswer = async ()=>{
    if(isSubmitting) return
    stopMic()
    setTimerRunning(false);
    setIsSubmitting(true)
    try {
      const res = await axios.post(ServerUrl + "/api/interview/submit-answer" ,{
        interviewId,
      questionIndex :currentIndex,
      answer,
      timetaken:currentQuestion.timeLimit - timeleft,
      
      },{withCredentials:true})

      setFeedback(res.data.feedback)

      speakText(res.data.feedback)
      setIsSubmitting(false)
    } catch (error) {
      console.log(error)
      setIsSubmitting(false)
    }
  }

  const handleNext = async ()=>{
    setTimerRunning(false);
    setAnswer("")
    setFeedback("")

    if(currentIndex + 1 >= questions.length){
      finishinterview()
      return
    }
    await speakText("Alright , lets move to next question.")
    setCurrentIndex(currentIndex+1)
    setTimeout(() => {
      if(isMicon) startMic()
      
    }, 500);
  }

  // =====================================
// Exit Interview
// =====================================
const handleExitInterview = () => {

  const confirmExit = window.confirm(
    "Are you sure you want to exit the interview?\nYour current progress will be lost."
  );

  if (!confirmExit) return;

  // Stop speech
  window.speechSynthesis.cancel();

  // Stop microphone
  stopMic();

  // Stop timer
  setTimerRunning(false);

  // Clear saved progress
  localStorage.removeItem("interviewStep");
  localStorage.removeItem("interviewData");
  localStorage.removeItem("interviewProgress");

  // Go back to Step 1
  window.location.reload();
  
};

  const finishinterview = async()=>{
    stopMic()
    setTimerRunning(false);
    setMicon(false)

    try {
      console.log("Interview ID:", interviewId);
      const res = await axios.post(ServerUrl + "/api/interview/finish" , {
        interviewId
      },{withCredentials:true})
      console.log(res.data)
      onFinish(res.data)
      localStorage.removeItem("interviewProgress");
      
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    if(isIntrophase) return
    if(!currentQuestion) return

    if(timeleft === 0 && !isSubmitting && !feedback){
      submitAnswer()
    }
  },[timeleft])

  useEffect(()=>{
    return ()=> {
    if(recognitionRef.current){
      recognitionRef.current.stop()
      recognitionRef.current.abort()
    }
    window.speechSynthesis.cancel()
  }
},[])


useEffect(() => {

    const progress = {

        interviewId,
        currentIndex,
        answer,
        feedback,
        timeleft

    };

    localStorage.setItem(
        "interviewProgress",
        JSON.stringify(progress)
    );

}, [currentIndex, answer, feedback, timeleft]);

useEffect(() => {

    const saved = localStorage.getItem("interviewProgress");

    if (!saved) return;

    const progress = JSON.parse(saved);

    if (progress.interviewId === interviewId) {

        setCurrentIndex(progress.currentIndex);
        setAnswer(progress.answer);
        setFeedback(progress.feedback);
        setTimeLeft(progress.timeleft);

        // Skip intro after refresh
        setIntrophase(false);

    }

}, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">
        {/* video section */}
        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={voiceSource}
              key={voiceSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* subtitle area */}
          {subtittle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">{subtittle}</p>
            </div>
          )}

          {/* timer area */}
          <div className="w-full max-w-md bg-blend-lighten border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Interview Status</span>
              {isAIPlaying && <span className="text-sm font-semibold text-emerald-600">
                {isAIPlaying ?  'AI Speaking' : ''}
              </span>}
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="flex justify-center">
              <Timer timeleft={timeleft} totalTime={currentQuestion?.timeLimit }/>
            </div>

           <div className="h-px bg-gray-200"></div>

           <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</span>
              <span className="text-xs text-gray-400">Current Question</span>
            </div>

            <div>
              <span className="text-2xl font-bold text-emerald-600">{questions.length}</span>
              <span className="text-xs text-gray-400">Total Questions</span>
            </div>
           </div>




          </div>
        </div>

        {/* Text Section */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6 ">
            AI Smart Interview
          </h2>

          <div className="flex justify-end mb-4">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={handleExitInterview}
    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all duration-300"
  >
    <FaSignOutAlt />
    Exit Interview
  </motion.button>
</div>

          {!isAIPlaying && <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed pr-16">{currentQuestion?.question}</div>
          </div>}

          <textarea onChange={(e)=> setAnswer(e.target.value)} 
         value={answer}
         placeholder="Type your answer here..." className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"/>

         {!feedback ? ( <div className="flex items-center gap-4 mt-6">
            <motion.button 
            onClick={toggleMic}
            whileTap={{scale:0.9}}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg">
                {isMicon ? <FaMicrophone size={20}/> : <FaMicrophoneSlash size={20}/>}
            </motion.button>


            <motion.button 
            onClick={submitAnswer}
            disabled={isSubmitting}
            whileTap={{scale:0.95}}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500">
              {isSubmitting?"Submitting" : "Submit Answer"}
            </motion.button>
          </div>):(
            <motion.div 
            initial={{opacity:0}}
            animate={{opacity:1}}
            className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
              <p className="text-emerald-700 font-medium mb-4">{feedback}</p>
              <button 
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1">
                Next Question <BsArrowLeft size={18}/>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2interview;
