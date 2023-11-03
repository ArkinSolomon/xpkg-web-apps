/*
 * Copyright (c) 2022-2023. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */
import './css/reset.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Footer from './components/Footer';
import Auth from './pages/Auth';

declare global {
  interface Window {
    grecaptcha: ReCaptchaV2.ReCaptcha;
    SITE_KEY: string;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Auth />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;