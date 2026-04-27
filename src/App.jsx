import React, { useState, useEffect, useRef } from 'react';

// Define the 4 experimental conditions and their video paths
const CONDITIONS = [
  { id: 'linear-gray', videoUrl: '/videos/linear-gray.webm' },
  { id: 'linear-red', videoUrl: '/videos/linear-red.webm' },
  { id: 'stuck-gray', videoUrl: '/videos/stuck-gray.webm' },
  { id: 'stuck-red', videoUrl: '/videos/stuck-red.webm' }
];

// Helper to assign a random condition
const getRandomCondition = () => CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

// Generate a random string for participant ID
const generateParticipantId = () => Math.random().toString(36).substring(2, 10);

export default function App() {
  // Application phases: consent, demographics, cover_story, stimulus, memory_task, time_estimation, manipulation_check, suspicion_check, debriefing
  const [phase, setPhase] = useState('consent');
  const [participantData, setParticipantData] = useState({
    id: '',
    condition: null
  });

  // Centralized state holding all user inputs, including the 5 memory task questions
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    noVisionIssues: false,
    noAdhd: false,
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    estimatedTime: '',
    uniformSpeed: '',
    colorSeen: '',
    focusLevel: 4,
    suspicion: ''
  });

  // Assign condition and ID on initial mount
  useEffect(() => {
    setParticipantData({
      id: generateParticipantId(),
      condition: getRandomCondition()
    });
  }, []);

  // Helper to update form data
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Submit data to Google Sheets via Apps Script
  const submitDataToGoogle = async () => {
    const payload = {
      participantId: participantData.id,
      condition: participantData.condition.id,
      ...formData
    };

    try {
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0PdlqvRkhpOs28P7YhkcQIFyo7QNLxJSEidum7k6qYI8AmgD9q0bLWA0py8apW1Ja/exec';
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Scripts without explicit CORS headers
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-gray-200 min-h-[60vh] flex flex-col">
        
        {phase === 'consent' && (
          <ConsentScreen onNext={() => setPhase('demographics')} />
        )}
        
        {phase === 'demographics' && (
          <DemographicsScreen 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={() => setPhase('cover_story')} 
          />
        )}
        
        {phase === 'cover_story' && (
          <CoverStoryScreen onNext={() => setPhase('stimulus')} />
        )}
        
        {phase === 'stimulus' && (
          <StimulusScreen 
            condition={participantData.condition} 
            onNext={() => setPhase('memory_task')} 
          />
        )}

        {phase === 'memory_task' && (
          <MemoryTaskScreen 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={() => setPhase('time_estimation')} 
          />
        )}
        
        {phase === 'time_estimation' && (
          <TimeEstimationScreen 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={() => setPhase('manipulation_check')} 
          />
        )}
        
        {phase === 'manipulation_check' && (
          <ManipulationCheckScreen 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={() => setPhase('suspicion_check')} 
          />
        )}

        {phase === 'suspicion_check' && (
          <SuspicionCheckScreen 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={async () => {
              await submitDataToGoogle();
              setPhase('debriefing');
            }} 
          />
        )}
        
        {phase === 'debriefing' && (
          <DebriefingScreen />
        )}

      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components for each phase of the experiment
// ------------------------------------------------------------------

function ConsentScreen({ onNext }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const scrollRef = useRef(null);

  // Function to detect when the user has scrolled to the bottom of the container
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Add a 5px buffer to account for rounding errors
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setHasScrolledToBottom(true);
    }
  };

  // Check on mount if the content is too short to require scrolling
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, []);

  return (
    <div className="flex-grow flex flex-col">
      <h2 className="text-2xl font-bold mb-4 border-b pb-4 text-center">טופס פנייה להשתתפות במחקר והסכמה מדעת</h2>

      <div className="flex justify-end mb-2">
        <a
          href="/consent-form.pdf"
          download="טופס_הסכמה_מדעת.pdf"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          הורד עותק למחשב (PDF)
        </a>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6 overflow-y-auto max-h-[50vh] text-gray-800 space-y-6 text-justify text-base leading-relaxed shadow-inner"
      >
        <div>
          <h3 className="font-bold mb-1 text-lg">1. הזמנה להשתתפות:</h3>
          <p>שלום רב,<br/>אנו מבקשים ממך להשתתף במחקר בשם: "השפעת מאפיינים דיגיטליים על תפיסה וזיכרון" אשר מטרתו היא ללמוד על האופן שבו בני אדם מעבדים מידע חזותי וזוכרים אותו. השתתפותך במחקר עשויה לתרום בצורה משמעותית להבנת הנושא. המחקר נערך במסגרת קורס "פסיכולוגיה ניסויית" תחת החוג למדעי הקוגניציה בבית הספר לפסיכולוגיה.</p>
        </div>
        
        <div>
          <h3 className="font-bold mb-1 text-lg">2. מטרת המחקר:</h3>
          <p>מטרת המחקר הינה ללמוד על האופן שבו בני אדם מעבדים מידע חזותי בעידן הדיגיטלי וזוכרים אותו.</p>
        </div>

        <div>
          <h3 className="font-bold mb-1 text-lg">3. מה כולל המחקר?</h3>
          <p>במסגרת המחקר תתבקש/י להשתתף בניסוי ממוחשב. משך הניסוי יהיה כ-5 דקות.</p>
        </div>

        <div>
          <h3 className="font-bold mb-1 text-lg">4. האם ישנם סיכונים/חוסר נוחות שעשויים להתלוות להשתתפות במחקר?</h3>
          <p>הסיכונים/חוסר נוחות הנלווים להשתתפות במחקר הינם מזעריים. בכל מקרה של אי נוחות ניתן לפנות לעורכת המחקר.</p>
        </div>

        <div>
          <h3 className="font-bold mb-1 text-lg">5. האם אני חייב/ת להשתתף?</h3>
          <p>חשוב לנו להבהיר כי ההשתתפות במחקר הנה מרצון ואינך חייב/ת להשתתף במחקר. לאי הסכמה שלך להשתתף או להפסקת השתתפותך במהלך הניסוי לא תהיה כל השלכה עליך ולא תפגע בך בכל דרך שהיא בהמשך.</p>
        </div>

        <div>
          <h3 className="font-bold mb-1 text-lg">6. חובות ועלויות:</h3>
          <p>מלבד המאמץ הנדרש בהשתתפות במחקר אין עלויות או חובות נוספות.</p>
        </div>

        <div> 
          <h3 className="font-bold mb-1 text-lg">7. תגמול:</h3>
          <p>המחקר מתבצע על בסיס התנדבותי.</p>
        </div>

        <div> 
          <h3 className="font-bold mb-1 text-lg">8. שמירה על סודיות:</h3>
          <p>כל הנתונים המזהים במחקר ישמרו חסויים ולא יהיו זמינים לאף אחד מלבד צוות המחקר. לא נאספים פרטים מזהים על הנבדקים.</p>
        </div>

        <div className="pt-4 border-t border-gray-300">
          <h3 className="font-bold mb-2">פנייה לצורך שאלות</h3>
          <p>שמות החוקרים: הילה דולב אדלר</p>
          <p>טלפון לפניות: 6306811</p>
          <p>כתובת דוא"ל: hiladolev.w@gmail.com</p>
          <br/>
          <p>בהערכה רבה,<br/>ביה"ס למדעי הפסיכולוגיה אוניברסיטת חיפה. הר הכרמל, חיפה 31905</p>
        </div>
      </div>

      <div className="mb-6">
        <label 
          className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
            hasScrolledToBottom 
              ? 'bg-white border-blue-200 cursor-pointer hover:bg-blue-50 shadow-sm' 
              : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!hasScrolledToBottom}
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className="mt-1 w-6 h-6 text-blue-600 focus:ring-blue-500 rounded"
          />
          <span className="text-lg font-semibold text-gray-800">
            קראתי ואישרתי (אישור זה מהווה חתימה דיגיטלית על הטופס)
          </span>
        </label>
        
        {!hasScrolledToBottom && (
          <p className="text-sm text-red-600 mt-2 font-bold animate-pulse">
            * יש לגלול עד תחתית מסמך ההסכמה כדי לאשר.
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!isAgreed}
        className="w-full bg-gray-800 text-white font-bold py-4 rounded-lg text-xl hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition shadow-md mt-auto"
      >
        המשך לניסוי
      </button>
    </div>
  );
}

function DemographicsScreen({ formData, updateFormData, onNext }) {
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.noVisionIssues || !formData.noAdhd) {
      setError(true);
      return;
    }
    setError(false);
    onNext();
  };

  return (
    <div className="flex-grow flex flex-col">
      <h2 className="text-2xl font-bold mb-6 border-b pb-4">פרטים אישיים ודמוגרפיה</h2>
      <form onSubmit={handleSubmit} className="flex-grow space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2 text-lg">גיל:</label>
            <input 
              type="number" 
              required 
              min="18" 
              max="120" 
              value={formData.age} 
              onChange={e => updateFormData({ age: e.target.value })} 
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none" 
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-lg">מגדר:</label>
            <select 
              required 
              value={formData.gender} 
              onChange={e => updateFormData({ gender: e.target.value })} 
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none"
            >
              <option value="" disabled>בחר...</option>
              <option value="male">גבר</option>
              <option value="female">אישה</option>
              <option value="other">אחר / מעדיף לא לציין</option>
            </select>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">הצהרות בריאותיות (תנאי סף להשתתפות):</h3>
          
          <label className="flex items-start gap-4 cursor-pointer bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
            <input 
              type="checkbox" 
              className="mt-1 w-6 h-6 text-blue-600"
              checked={formData.noVisionIssues}
              onChange={e => updateFormData({ noVisionIssues: e.target.checked })}
            />
            <span className="text-lg">אני מאשר/ת שראייתי תקינה (או מתוקנת באמצעות משקפיים/עדשות מגע).</span>
          </label>

          <label className="flex items-start gap-4 cursor-pointer bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
            <input 
              type="checkbox" 
              className="mt-1 w-6 h-6 text-blue-600"
              checked={formData.noAdhd}
              onChange={e => updateFormData({ noAdhd: e.target.checked })}
            />
            <span className="text-lg">אני מאשר/ת שאינני מאובחן/ת עם הפרעת קשב וריכוז (ADHD/ADD).</span>
          </label>
          
          {error && <div className="text-red-600 font-bold mt-2">יש לאשר את שתי ההצהרות כדי להמשיך בניסוי.</div>}
        </div>

        <button type="submit" className="w-full bg-gray-800 text-white font-bold py-4 rounded-lg text-lg hover:bg-gray-700 transition shadow-md mt-8">
          המשך
        </button>
      </form>
    </div>
  );
}

function CoverStoryScreen({ onNext }) {
  return (
    <div className="flex-grow flex flex-col justify-center items-center text-center">
      <h2 className="text-4xl font-bold mb-6 text-gray-900">מבחן זיכרון שפתי</h2>
      <p className="text-xl text-gray-700 mb-12 max-w-lg leading-relaxed">
        מיד תתחיל/י במטלת הזיכרון. המסך יטען ולאחר מכן יוצג בפניך סיפור קצר.
        קרא/י אותו בעיון, שכן מיד לאחר מכן תישאל/י עליו מספר שאלות.
      </p>
      <button 
        onClick={onNext}
        className="bg-blue-600 text-white px-12 py-4 rounded-lg font-bold text-xl hover:bg-blue-700 transition shadow-lg"
      >
        המשך לטעינת המטלה
      </button>
    </div>
  );
}

function StimulusScreen({ condition, onNext }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Fallback timer
    const safetyTimer = setTimeout(() => {
      console.warn("Safety timeout. Video might be missing.");
      onNext();
    }, 13000);

    return () => clearTimeout(safetyTimer);
  }, [onNext]);

  return (
    <div className="flex-grow flex flex-col justify-center items-center w-full h-full bg-white relative">
      <video
        ref={videoRef}
        src={condition?.videoUrl}
        autoPlay
        playsInline
        disablePictureInPicture
        onEnded={onNext}
        onError={(e) => {
          console.error("Video error:", e);
          onNext(); 
        }}
        className="w-full max-w-4xl h-auto object-contain"
        style={{ pointerEvents: 'none' }} 
      />
    </div>
  );
}

function MemoryTaskScreen({ formData, updateFormData, onNext }) {
  const [step, setStep] = useState('story'); // 'story' or 'questions'

  const questions = [
    { id: 'q1', text: 'לאן דן הלך בבוקר?', options: ['לסופרמרקט', 'לבית קפה', 'לפארק', 'לבנק'] },
    { id: 'q2', text: 'מה דן הזמין לאכול?', options: ['עוגת שוקולד', 'כריך גבינה', 'מאפה קינמון', 'עוגיות חמאה'] },
    { id: 'q3', text: 'באיזה צבע היה המעיל של דן?', options: ['שחור', 'אפור', 'כחול', 'ירוק'] },
    { id: 'q4', text: 'באיזה יום בשבוע התרחש הסיפור?', options: ['ראשון', 'שני', 'שלישי', 'רביעי'] },
    { id: 'q5', text: 'כמה זמן ישב דן לפני שהמשיך למשרד?', options: ['10 דקות', '15 דקות', '20 דקות', '30 דקות'] }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  if (step === 'story') {
    return (
      <div className="flex-grow flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-6 text-center">קרא/י את הסיפור הבא:</h2>
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm text-xl leading-relaxed text-justify mb-10">
          "ביום שלישי בבוקר, יצא דן מדירתו לכיוון בית הקפה השכונתי 'קפה על הדרך'. בחוץ נשבה רוח קרירה, ולכן הוא לבש את מעילו הכחול. כשהגיע, הוא הזמין קפה הפוך קטן ומאפה קינמון. דן התיישב בשולחן הפינתי הקבוע שלו, קרא בעיתון הספורט במשך 20 דקות, ולאחר מכן המשיך בדרכו למשרד."
        </div>
        <button 
          onClick={() => setStep('questions')}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 transition shadow-md"
        >
          סיימתי לקרוא, עבור לשאלות
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
      <h2 className="text-2xl font-bold mb-6 border-b pb-4">מבחן זיכרון: ענה/י על השאלות הבאות</h2>
      <form onSubmit={handleSubmit} className="flex-grow space-y-8">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label className="block font-semibold mb-4 text-lg">{index + 1}. {q.text}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map(option => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-300 hover:bg-blue-50 transition">
                  <input 
                    type="radio" 
                    name={q.id} 
                    value={option} 
                    required 
                    checked={formData[q.id] === option} 
                    onChange={e => updateFormData({ [q.id]: e.target.value })} 
                    className="w-5 h-5 text-blue-600" 
                  /> 
                  <span className="text-lg">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className="w-full bg-gray-800 text-white font-bold py-4 rounded-lg text-xl hover:bg-gray-700 transition shadow-md">
          המשך
        </button>
      </form>
    </div>
  );
}

function TimeEstimationScreen({ formData, updateFormData, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="flex-grow flex flex-col justify-center">
      <h2 className="text-3xl font-bold mb-10 text-center">הערכת זמן</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-8 bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <label className="block font-semibold mb-6 text-xl text-center leading-relaxed">
            לפני שניגש לתוצאות מבחן הזיכרון, כמה שניות לדעתך ארכה הטעינה לפני שהסיפור הופיע?
          </label>
          <input 
            type="number" 
            required 
            min="1"
            step="0.1"
            value={formData.estimatedTime}
            onChange={e => updateFormData({ estimatedTime: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg text-center text-3xl font-bold focus:ring-4 focus:ring-blue-200 outline-none"
            placeholder="מספר שניות"
            autoFocus
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 transition shadow-md">
          אישור והמשך
        </button>
      </form>
    </div>
  );
}

function ManipulationCheckScreen({ formData, updateFormData, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(); 
  };

  return (
    <div className="flex-grow flex flex-col">
      <form onSubmit={handleSubmit} className="flex-grow space-y-8">
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <label className="block font-semibold mb-4 text-lg">האם לדעתך קצב התקדמות הטעינה שראית היה אחיד לכל אורך הזמן?</label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-3 cursor-pointer text-lg p-3 bg-white rounded-lg border border-gray-300 w-32 justify-center hover:bg-gray-50 shadow-sm">
              <input type="radio" name="uniformSpeed" value="yes" required checked={formData.uniformSpeed === 'yes'} onChange={e => updateFormData({ uniformSpeed: e.target.value })} className="w-5 h-5 text-blue-600" /> כן
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-lg p-3 bg-white rounded-lg border border-gray-300 w-32 justify-center hover:bg-gray-50 shadow-sm">
              <input type="radio" name="uniformSpeed" value="no" required checked={formData.uniformSpeed === 'no'} onChange={e => updateFormData({ uniformSpeed: e.target.value })} className="w-5 h-5 text-blue-600" /> לא
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-lg">מה היה צבעו של אלמנט הטעינה שראית?</label>
          <select required value={formData.colorSeen} onChange={e => updateFormData({ colorSeen: e.target.value })} className="p-3 border border-gray-300 rounded-lg bg-gray-50 w-full md:w-1/2 text-lg focus:ring-2 outline-none">
            <option value="" disabled>בחר צבע...</option>
            <option value="gray">אפור</option>
            <option value="red">אדום</option>
            <option value="blue">כחול</option>
            <option value="green">ירוק</option>
            <option value="yellow">צהוב</option>
            <option value="orange">כתום</option>
            <option value="purple">סגול</option>
            <option value="black">שחור</option>
            <option value="white">לבן</option>
            <option value="other">אחר</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-4 text-lg">האם היית מרוכז/ת במסך לאורך כל זמן הטעינה? (1 - כלל לא, 7 - מאוד)</label>
          <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <span className="font-bold text-xl">1</span>
            <input 
              type="range" 
              min="1" 
              max="7" 
              value={formData.focusLevel} 
              onChange={e => updateFormData({ focusLevel: e.target.value })} 
              className="flex-grow cursor-pointer h-2 bg-gray-300 rounded-lg appearance-none"
            />
            <span className="font-bold text-xl">7</span>
          </div>
          <div className="text-center text-gray-600 mt-2 font-semibold">רמת ריכוז שנבחרה: <span className="text-blue-600 text-xl">{formData.focusLevel}</span></div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-gray-800 text-white font-bold py-4 rounded-lg text-xl hover:bg-gray-700 transition shadow-md mt-6"
        >
          המשך
        </button>
      </form>
    </div>
  );
}

function SuspicionCheckScreen({ formData, updateFormData, onNext }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onNext(); 
  };

  return (
    <div className="flex-grow flex flex-col">
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-8">
        
        <div className="flex-grow">
          <label className="block font-semibold mb-4 text-xl">לדעתך, מה הייתה מטרת הניסוי המרכזית?</label>
          <p className="text-gray-600 mb-4 text-sm">
            אנא פרט/י ככל הניתן על המטרה שלדעתך עומדת מאחורי המטלות שביצעת עד כה.
          </p>
          <textarea 
            required 
            rows="6" 
            value={formData.suspicion}
            onChange={e => updateFormData({ suspicion: e.target.value })} 
            className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 resize-none text-lg focus:ring-2 outline-none"
            placeholder="כתוב/י את תשובתך כאן..."
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md mt-auto"
        >
          {isSubmitting ? 'שומר נתונים, אנא המתן...' : 'סיום הניסוי והגשה'}
        </button>
      </form>
    </div>
  );
}

function DebriefingScreen() {
  return (
    <div className="flex-grow flex flex-col justify-center text-center">
      <div className="text-green-600 mb-6">
        <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-6 text-gray-900">תודה רבה על השתתפותך!</h2>
      <div className="text-gray-700 max-w-xl mx-auto text-justify space-y-5 text-lg leading-relaxed bg-gray-50 p-8 rounded-xl border border-gray-200">
        <p>
          אנו מודים לך על הזמן שהקדשת למחקר זה!
          <br/><br/>
          כעת נוכל לחשוף בפניך כי המטרה האמיתית של הניסוי הייתה  <strong>בחינת תפיסת זמן סובייקטיבית</strong>.
        </p>
        <p>
          בניסוי זה בדקנו כיצד מאפיינים שונים של "בר טעינה" (כגון קצב התקדמותו והצבע שלו) משפיעים על האופן שבו אנשים מעריכים את משך הזמן שחלף.         </p>
        <p>
          השימוש ב"סיפור הכיסוי" של מבחן הזיכרון השפתי (הסיפור על דן) היה הכרחי כדי לא להפנות את תשומת ליבך באופן מכוון לזמן שעובר בעת הטעינה, ובכך לאפשר מדידה טבעית ככל האפשר של תפיסת הזמן.
        </p>
        <p className="pt-6 font-bold text-center text-green-700 border-t border-gray-300 mt-4">
          הנתונים נשמרו בהצלחה. כעת ניתן לסגור חלון זה.
        </p>
      </div>
    </div>
  );
}