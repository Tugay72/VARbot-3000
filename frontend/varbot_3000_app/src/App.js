import React, { useState } from 'react';
import 'antd/dist/reset.css';
import { Select, Button, Row, Col, Card, message } from 'antd';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';
import teamOptions from './teamOptions';

function App() {
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [stats, setStats] = useState({ home: { goals: 0 }, away: { goals: 0 } });
    const [chartData, setChartData] = useState({ home: [], away: [] });

    const [messageApi, contextHolder] = message.useMessage();

    const error_notification = (message) => {
        messageApi.open({
            type: 'error',
            content: message,
        });
    };

    const handleSubmit = async () => {
        if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
            error_notification('Takım bulunamadı!')
            return;
        }

        try {
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

            if (!res.ok) {
                error_notification('Veri bulunamadı')
                return;
            }

            const data = await res.json();

            if (!data || data.home_score === undefined || data.away_score === undefined) {
                error_notification('Hatalı sonuç')
                return;
            }

            setStats({
                home: { goals: Math.round(data.home_score) },
                away: { goals: Math.round(data.away_score) }
            });

            const homeData = Object.entries(data.home_goal_probs).map(([goal, value]) => ({
                goal: goal,
                value: parseFloat(Number(value).toFixed(2))
            }));


            const awayData = Object.entries(data.away_goal_probs).map(([goal, value]) => ({
                goal: goal,
                value: parseFloat(Number(value).toFixed(2))
            }));


            setChartData({ home: homeData, away: awayData });

        } catch (error) {
            console.error(error);
            error_notification('Hata')
        }
    };



    return (
        <div className="App">
            {contextHolder}
            <div className="App-container">
                <Row gutter={16} align="middle" style={{ marginBottom: '20px' }}>
                    <Col span={8}>
                        <Select
                            showSearch
                            placeholder="Ev Sahibi Takım"
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
                            placeholder="Deplasman Takımı"
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
                            Tahmin Et
                        </Button>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Card title={`Ev Sahibi: ${homeTeam || '-'}`}>
                            <p>Gol Tahmini: {stats.home.goals}</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.home}>
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
                        <Card title={`Deplasman: ${awayTeam || '-'}`}>
                            <p>Gol Tahmini: {stats.away.goals}</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.away}>
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
