import React, { useState } from 'react';
import { Select, Button, Row, Col, Card, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

import teamOptions from './teamOptions.js'

function App() {
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [stats, setStats] = useState({
        home: { goals: 0 },
        away: { goals: 0 }
    });
    const [goalProbs, setGoalProbs] = useState({
        home: {},
        away: {}
    });

    const handleSubmit = async () => {
        if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
            message.error("Lütfen farklı iki takım seçin.");
            return;
        }

        const res = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                home_team: homeTeam,
                away_team: awayTeam,
                tournament: "Friendly",
                neutral: 0,
                year: 2025
            })
        });

        const data = await res.json();

        setStats({
            home: { goals: Math.round(data.home_score) },
            away: { goals: Math.round(data.away_score) }
        });

        setGoalProbs({
            home: data.home_goal_probs,
            away: data.away_goal_probs
        });
    };

    const homeData = Object.keys(goalProbs.home).map(goal => ({
        goal: goal,
        value: goalProbs.home[goal]
    }));

    const awayData = Object.keys(goalProbs.away).map(goal => ({
        goal: goal,
        value: goalProbs.away[goal]
    }));

    return (
        <div className="App">
            <div className="App-container">
                <Row gutter={16} align="middle" style={{ marginBottom: '20px' }}>
                    <Col span={8}>
                        <Select
                            showSearch
                            placeholder="Select Home Team"
                            style={{ width: 160 }}
                            options={teamOptions}
                            onChange={value => setHomeTeam(value)}
                            value={homeTeam}
                            filterOption={(input, option) =>
                                option.label.toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Col>
                    <Col span={8}>
                        <Select
                            showSearch
                            placeholder="Select Away Team"
                            style={{ width: 160 }}
                            options={teamOptions.filter(team => team.value !== homeTeam)}
                            onChange={value => setAwayTeam(value)}
                            value={awayTeam}
                            filterOption={(input, option) =>
                                option.label.toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Col>

                    <Col span={8}>
                        <Button type="primary" onClick={handleSubmit}>
                            Predict Result
                        </Button>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Card title={`Home: ${homeTeam || '-'}`}>
                            <p>Goals: {stats.home.goals}</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={homeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="goal" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title={`Away: ${awayTeam || '-'}`}>
                            <p>Goals: {stats.away.goals}</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={awayData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="goal" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default App;
