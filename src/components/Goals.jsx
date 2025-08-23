import React, { useState, useEffect } from 'react';
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService;

const Goals = ({ user }) => {
  const [ideas, setIdeas] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [dailyChecklist, setDailyChecklist] = useState({
    helpedClients: false,
    workedOnGoal: false,
    madeProgress: false,
    knowWhatToDo: false,
    knowTomorrow: false
  });
  
  const [newIdea, setNewIdea] = useState('');
  const [selectedIdea, setSelectedIdea] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [subtasks, setSubtasks] = useState(['']);

  // Load data from database
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    // Load ideas
    const { data: ideasData } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', user.id);
    if (ideasData) setIdeas(ideasData);

    // Load goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (goalsData) setGoals(goalsData);

    // Load active goal
    const { data: activeGoalData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .single();
    if (activeGoalData) setActiveGoal(activeGoalData);

    // Load completed goals
    const { data: completedData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed');
    if (completedData) setCompletedGoals(completedData);

    // Load today's checklist
    const today = new Date().toISOString().split('T')[0];
    const { data: checklistData } = await supabase
      .from('daily_checklist')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    if (checklistData) setDailyChecklist(checklistData.checklist);
  };

  // Add new idea
  const addIdea = async () => {
    if (!newIdea.trim()) return;
    
    const { data, error } = await supabase
      .from('ideas')
      .insert([{ user_id: user.id, title: newIdea, created_at: new Date() }])
      .select()
      .single();
    
    if (data && !error) {
      setIdeas([...ideas, data]);
      setNewIdea('');
    }
  };

  // Convert idea to goal
  const createGoalFromIdea = async () => {
    if (!goalTitle.trim() || !goalDeadline) return;
    
    const tasksArray = subtasks.filter(task => task.trim() !== '');
    const goalData = {
      user_id: user.id,
      title: goalTitle,
      deadline: goalDeadline,
      subtasks: tasksArray.map(task => ({ task, completed: false })),
      status: 'active',
      created_at: new Date()
    };

    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select()
      .single();
    
    if (data && !error) {
      setGoals([...goals, data]);
      setGoalTitle('');
      setGoalDeadline('');
      setSubtasks(['']);
      setSelectedIdea('');
    }
  };

  // Start working on goal
  const startGoal = async (goal) => {
    await supabase
      .from('goals')
      .update({ status: 'in_progress' })
      .eq('id', goal.id);
    
    setActiveGoal(goal);
    loadUserData();
  };

  // Toggle subtask completion
  const toggleSubtask = async (goalId, taskIndex) => {
    const goal = activeGoal;
    const updatedSubtasks = [...goal.subtasks];
    updatedSubtasks[taskIndex].completed = !updatedSubtasks[taskIndex].completed;
    
    await supabase
      .from('goals')
      .update({ subtasks: updatedSubtasks })
      .eq('id', goalId);
    
    // Check if goal is completed
    const completedTasks = updatedSubtasks.filter(task => task.completed).length;
    if (completedTasks === updatedSubtasks.length) {
      await supabase
        .from('goals')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', goalId);
      setActiveGoal(null);
    }
    
    loadUserData();
  };

  // Save daily checklist
  const updateChecklist = async (key, value) => {
    const newChecklist = { ...dailyChecklist, [key]: value };
    setDailyChecklist(newChecklist);
    
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_checklist')
      .upsert([{
        user_id: user.id,
        date: today,
        checklist: newChecklist
      }]);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const updateSubtask = (index, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const calculateProgress = (goal) => {
    if (!goal.subtasks || goal.subtasks.length === 0) return 0;
    const completed = goal.subtasks.filter(task => task.completed).length;
    return Math.round((completed / goal.subtasks.length) * 100);
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    
    if (diff <= 0) return "Verlopen";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}u ${minutes}m`;
  };

  return (
    <div className="myarc-animate-in">
      <h1 className="myarc-text-green myarc-mb-xl" style={{fontSize: 'var(--text-2xl)', fontWeight: '900', textAlign: 'center'}}>🎯 Hyperproductief Dashboard</h1>
      
      {/* Ideas Section */}
      <div className="myarc-card">
        <h2 className="myarc-card-title">💡 Ideeën</h2>
        <div className="myarc-flex myarc-gap-md myarc-mb-lg">
          <input
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Nieuw idee..."
            className="myarc-input"
            style={{flex: 1}}
          />
          <button onClick={addIdea} className="myarc-btn myarc-btn-primary">
            Toevoegen
          </button>
        </div>
        <div className="myarc-grid myarc-grid-3">
          {ideas.map((idea, index) => (
            <div key={index} className="myarc-p-md" style={{background: 'var(--c-bg-dark)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)'}}>
              {idea.title}
            </div>
          ))}
        </div>
      </div>

      {/* Create Goal Section */}
      <div className="myarc-card">
        <h2 className="myarc-card-title">🎯 Idee Uitwerken naar Doel</h2>
        <div className="myarc-flex myarc-flex-col myarc-gap-md">
          <input
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Doel titel..."
            className="myarc-input"
          />
          <input
            type="datetime-local"
            value={goalDeadline}
            onChange={(e) => setGoalDeadline(e.target.value)}
            className="myarc-input"
          />
          <div>
            <h3 className="myarc-text-white myarc-mb-md" style={{fontWeight: 600}}>Subtaken:</h3>
            {subtasks.map((subtask, index) => (
              <div key={index} className="myarc-flex myarc-gap-md myarc-mb-sm">
                <input
                  type="text"
                  value={subtask}
                  onChange={(e) => updateSubtask(index, e.target.value)}
                  placeholder={`Subtaak ${index + 1}...`}
                  className="myarc-input"
                  style={{flex: 1}}
                />
              </div>
            ))}
            <button onClick={addSubtask} className="myarc-btn myarc-btn-ghost myarc-mt-sm">
              + Subtaak
            </button>
          </div>
          <button onClick={createGoalFromIdea} className="myarc-btn myarc-btn-primary">
            Doel Aanmaken
          </button>
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="myarc-card">
        <h2 className="myarc-card-title">📋 Dagelijkse Checklist</h2>
        <div className="myarc-flex myarc-flex-col myarc-gap-md">
          {[
            { key: 'helpedClients', text: 'Ik heb alle cliënten die hulp nodig hadden geholpen vandaag' },
            { key: 'workedOnGoal', text: 'Ik ben bezig geweest met een doel en dat was het doel dat ik moet afmaken' },
            { key: 'madeProgress', text: 'Ik heb grote stappen gezet richting het doel' },
            { key: 'knowWhatToDo', text: 'Ik weet wat ik nog moet doen om mijn doel af te ronden' },
            { key: 'knowTomorrow', text: 'Ik weet wat ik morgen moet doen' }
          ].map((item) => (
            <label key={item.key} className="myarc-flex myarc-items-center myarc-gap-md">
              <input
                type="checkbox"
                checked={dailyChecklist[item.key]}
                onChange={(e) => updateChecklist(item.key, e.target.checked)}
                className="myarc-checkbox"
              />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Goal */}
      {activeGoal && (
        <div className="myarc-card">
          <h2 className="myarc-card-title">🚀 Actief Doel</h2>
          <div className="myarc-p-lg" style={{background: 'var(--c-bg-dark)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)'}}>
            <h3 className="myarc-text-green myarc-mb-sm" style={{fontSize: 'var(--text-lg)', fontWeight: 600}}>{activeGoal.title}</h3>
            <p className="myarc-text-gray myarc-mb-lg">Tijd over: {getTimeRemaining(activeGoal.deadline)}</p>
            <div className="myarc-mb-lg">
              <div className="myarc-progress">
                <div 
                  className="myarc-progress-fill"
                  style={{ width: `${calculateProgress(activeGoal)}%` }}
                ></div>
              </div>
              <p className="myarc-text-gray myarc-mt-sm" style={{fontSize: 'var(--text-sm)'}}>{calculateProgress(activeGoal)}% voltooid</p>
            </div>
            <div className="myarc-flex myarc-flex-col myarc-gap-sm">
              {activeGoal.subtasks?.map((subtask, index) => (
                <label key={index} className="myarc-flex myarc-items-center myarc-gap-md">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(activeGoal.id, index)}
                    className="myarc-checkbox"
                  />
                  <span className={subtask.completed ? 'myarc-text-gray' : 'myarc-text-white'} style={{textDecoration: subtask.completed ? 'line-through' : 'none'}}>
                    {subtask.task}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Goals */}
      {goals.length > 0 && (
        <div className="myarc-card">
          <h2 className="myarc-card-title">📝 Beschikbare Doelen</h2>
          <div className="myarc-grid myarc-grid-2">
            {goals.map((goal) => (
              <div key={goal.id} className="myarc-p-lg" style={{border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', background: 'var(--c-bg-dark)'}}>
                <h3 className="myarc-text-white myarc-mb-sm" style={{fontWeight: 600}}>{goal.title}</h3>
                <p className="myarc-text-gray myarc-mb-md" style={{fontSize: 'var(--text-sm)'}}>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                <button 
                  onClick={() => startGoal(goal)}
                  className="myarc-btn myarc-btn-secondary"
                  disabled={activeGoal !== null}
                  style={{fontSize: 'var(--text-sm)'}}
                >
                  Start Doel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="myarc-card">
          <h2 className="myarc-card-title">🏆 Voltooide Doelen</h2>
          <div className="myarc-grid myarc-grid-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="myarc-p-lg" style={{background: 'rgba(9,219,9,0.1)', border: '1px solid var(--c-accent)', borderRadius: 'var(--radius)'}}>
                <h3 className="myarc-text-green myarc-mb-sm" style={{fontWeight: 600}}>{goal.title}</h3>
                <p className="myarc-text-gray" style={{fontSize: 'var(--text-sm)'}}>
                  Voltooid: {new Date(goal.completed_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
