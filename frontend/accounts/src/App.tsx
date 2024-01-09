/*
 * Copyright (c) 2023-2024. Arkin Solomon.
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
import Authenticate from './pages/Authenticate';
import Authorize from './pages/Authorize';
import Account from './pages/Account';
import Verify from './pages/Verify';
import EmailChange from './pages/EmailChange';

declare global {
  interface Window {
    grecaptcha: ReCaptchaV2.ReCaptcha;
    SITE_KEY: string;
    XIS_URL: string;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/account' element={<Account />} />
        <Route path='/authenticate' element={<Authenticate />} />
        <Route path='/authorize' element={<Authorize />} />
        <Route path='/changeemail' element={<EmailChange />} />
        <Route path='/verify' element={<Verify />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;