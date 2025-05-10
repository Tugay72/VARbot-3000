import React, { useEffect, useState } from 'react';
import 'antd/dist/reset.css';
import { Select, Button, Row, Col, Card, message, Table, Tag } from 'antd';
import { SwapOutlined } from '@ant-design/icons'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';
import teamOptions from './teamOptions';

const columns = [
    {
        title: 'Tarih',
        dataIndex: 'date',
        key: 'date',
    },
    {
        title: 'Ev Sahibi',
        dataIndex: 'home_team',
        key: 'home_team',
        render: (text, record) => {
            const color = record.home_score > record.away_score ? 'green' :
                record.home_score < record.away_score ? 'red' : 'default';
            return <Tag color={color}>{text}</Tag>;
        }
    },
    {
        title: 'Skor',
        key: 'score',
        render: (text, record) => `${record.home_score} - ${record.away_score}`,
    },
    {
        title: 'Deplasman',
        dataIndex: 'away_team',
        key: 'away_team',
        render: (text, record) => {
            const color = record.away_score > record.home_score ? 'green' :
                record.away_score < record.home_score ? 'red' : 'default';
            return <Tag color={color}>{text}</Tag>;
        }
    },
    {
        title: 'Turnuva',
        dataIndex: 'tournament',
        key: 'tournament',
    },
    {
        title: 'Ülke',
        dataIndex: 'country',
        key: 'country',
    }
];

function App() {
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [stats, setStats] = useState({ home: { goals: 0 }, away: { goals: 0 } });
    const [chartData, setChartData] = useState({ home: [], away: [] });
    const [matchHistory, setMatchHistory] = useState([]);

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

        // Skor ve gol tahmini yap
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


        // Geçmiş maçları al
        try {
            const historyRes = await fetch(`http://127.0.0.1:5000/history?home=${homeTeam}&away=${awayTeam}`);
            const historyData = await historyRes.json();
            setMatchHistory(historyData);
        } catch (err) {
            console.error("Geçmiş veri alınamadı", err);
        }

    };

    return (
        <div className="App">
            {contextHolder}
            <div className="App-container">
                <Row gutter={16} align="middle" style={{ marginBottom: '20px' }}>
                    <Col span={7}>
                        <Select
                            showSearch
                            placeholder="Ev Sahibi Takım"
                            style={{ width: '100%' }}
                            options={teamOptions}
                            onChange={value => setHomeTeam(value)}
                            value={homeTeam}
                            filterOption={(input, option) =>
                                option.label.toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                        <Button
                            onClick={() => {
                                const temp = homeTeam;
                                setHomeTeam(awayTeam);
                                setAwayTeam(temp);
                            }}
                            icon={<SwapOutlined />}
                        />
                    </Col>
                    <Col span={7}>
                        <Select
                            showSearch
                            placeholder="Deplasman Takımı"
                            style={{ width: '100%' }}
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
                <Row gutter={16} style={{ marginTop: '20px' }}>
                    <Col span={24}>
                        <Card title="İki Takım Arasındaki Geçmiş Maçlar">
                            <Table
                                columns={columns}
                                dataSource={matchHistory}
                                pagination={{ pageSize: 10, showSizeChanger: false }}
                                rowKey={(record, index) => index}
                                locale={{ emptyText: 'Geçmiş maç bulunamadı.' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default App;
