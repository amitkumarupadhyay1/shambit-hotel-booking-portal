'use client';

import React from 'react';

export default function ComponentTestPage() {
  console.log('ComponentTestPage - Rendered successfully');
  
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Component Test</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>If you can see this page and the console shows the log message, then basic React rendering is working.</p>
          <p>Check the browser console for: "ComponentTestPage - Rendered successfully"</p>
        </div>
      </div>
    </div>
  );
}