'use client' ;
import { Roboto } from 'next/font/google';
import React from 'react'
import { useState } from 'react'

export default function Todo() {
  const [task, setTask] = useState('');
  const [todos, setTodos] = useState<string[]>([]);
  
  const handleAdd = () => {
    if (task.trim() === '')
      return;
    setTodos([...todos, task]);
    setTask('');
  
  };

  const handleDelete = (index: number) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos)
  };

  return (
    <main style={{ textAlign : 'center' , fontSize : '20px' , margin : '30px'}}>
      <div><h1 style={{fontSize : '30px' , fontWeight : 'bold' }}>Todo List</h1>
      <input style={{margin : '20px'}}
        type='text'
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder='Add a task'
      />
      <button onClick={handleAdd}>Add</button>
      <ul style= {{backgroundColor : '#000000' , margin : '0 auto', textAlign : 'center', maxWidth: '300px',  justifyContent: 'space-between'}}>
       {todos.map((todo, index) => (
        <li key={index} className='todo-item'>
          <span>{index + 1}.</span>
          {todo}
          <button
            onClick={() => handleDelete(index)}>   ❌</button>
        </li>
      
      ))}
      
      </ul>
      </div>
    </main>
  )
}