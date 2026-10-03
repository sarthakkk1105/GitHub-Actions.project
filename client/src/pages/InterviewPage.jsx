// import React, { useState } from "react";
// import Step1setup from "../components/Step1setup";
// import Step2interview from "../components/Step2interview";
// import Step3repot from "../components/Step3repot";

// const InterviewPage = () => {
//   const [step, setStep] = useState(1);
//   const [interviewData, settInterviewData] = useState(null);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {step === 1 && (
//         <Step1setup
//           onStart={(data) => {
//             settInterviewData(data);
//             setStep(2);
//           }}
//         />
//       )}
//       {step === 2 && (
//         <Step2interview
//           interviewData={interviewData}
//           onFinish={(report) => {
//             setInterviewData(report);
//             setStep(3);
//           }}
//         />
//       )}
//       {step === 3 && <Step3repot report={interviewData} />}
//     </div>
//   );
// };

// export default InterviewPage;
import React, { useEffect, useState } from "react";
import Step1setup from "../components/Step1setup";
import Step2interview from "../components/Step2interview";
import Step3repot from "../components/Step3repot";

const InterviewPage = () => {

  // ==========================================
  // UPDATED:
  // Restore current step after page refresh
  // ==========================================
  const [step, setStep] = useState(() => {
    return Number(localStorage.getItem("interviewStep")) || 1;
  });

  // ==========================================
  // UPDATED:
  // Restore interview data after refresh
  // ==========================================
  const [interviewData, settInterviewData] = useState(() => {
    const saved = localStorage.getItem("interviewData");
    return saved ? JSON.parse(saved) : null;
  });

  // ==========================================
  // UPDATED:
  // Save whenever step changes
  // ==========================================
  useEffect(() => {
    localStorage.setItem("interviewStep", step);
  }, [step]);

  // ==========================================
  // UPDATED:
  // Save interview data whenever it changes
  // ==========================================
  useEffect(() => {
    if (interviewData) {
      localStorage.setItem(
        "interviewData",
        JSON.stringify(interviewData)
      );
    }
  }, [interviewData]);

  return (
    <div className="min-h-screen bg-gray-50">

      {step === 1 && (
        <Step1setup
          onStart={(data) => {

            // ===========================
            // UPDATED:
            // Save interview data
            // ===========================
            settInterviewData(data);

            // ===========================
            // UPDATED:
            // Move to Step 2
            // ===========================
            setStep(2);

          }}
        />
      )}

      {step === 2 && interviewData && (
        <Step2interview
          interviewData={interviewData}
          onFinish={(report) => {

            // ===========================
            // UPDATED:
            // FIXED TYPO
            // ===========================
            settInterviewData(report);

            // ===========================
            // UPDATED:
            // Move to Step 3
            // ===========================
            setStep(3);

          }}
        />
      )}

      {step === 3 && interviewData && (
        <Step3repot report={interviewData} />
      )}

    </div>
  );
};

export default InterviewPage;