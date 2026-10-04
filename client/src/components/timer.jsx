import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Timer = ({timeleft,totalTime}) => {
    const percentage = (timeleft / totalTime)*100
  return (
    <div className='w-20 h-20'>
        <CircularProgressbar
        value={percentage} 
        text={`${timeleft}s`}
        styles={buildStyles({
            textSize: "20px",
            pathColor: "#10b981",
            textColor: "#ef4444",
            trailColor: "#e5e7eb"
        })}/>
    </div>
  )
}

export default Timer