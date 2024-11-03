import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PeopleList from './components/PeopleList';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<PeopleList />} />
            </Routes>
        </Router>
    );
};

export default App;