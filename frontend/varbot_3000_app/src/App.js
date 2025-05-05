import React, { useState } from 'react';
import { Select, Button, Row, Col, Card } from 'antd';
import './App.css';


const teamOptions = [
    { value: 'argentina', label: 'Argentina' },
    { value: 'brazil', label: 'Brazil' },
    { value: 'france', label: 'France' },
    { value: 'germany', label: 'Germany' },
    { value: 'england', label: 'England' },
    { value: 'spain', label: 'Spain' },
    { value: 'italy', label: 'Italy' },
    { value: 'portugal', label: 'Portugal' },
    { value: 'netherlands', label: 'Netherlands' },
    { value: 'belgium', label: 'Belgium' },
    { value: 'uruguay', label: 'Uruguay' },
    { value: 'croatia', label: 'Croatia' },
    { value: 'japan', label: 'Japan' },
    { value: 'south_korea', label: 'South Korea' },
    { value: 'usa', label: 'USA' },
    { value: 'mexico', label: 'Mexico' },
    { value: 'morocco', label: 'Morocco' },
    { value: 'senegal', label: 'Senegal' },
    { value: 'australia', label: 'Australia' },
    { value: 'switzerland', label: 'Switzerland' }
];


function App() {

    const [homeTeam, setHomeTeam] = useState('A');
    const [awayTeam, setAwayTeam] = useState('B');
    const [stats, setStats] = useState({
        home: {
            possession: '0%',
            shots: 0,
            goals: 0
        },
        away: {
            possession: '0%',
            shots: 0,
            goals: 0
        }
    });
    const handleChange = value => {
        console.log(`selected ${value}`);
    };
    const handleSubmit = () => {
        setStats({
            home: {
                possession: '55%',
                shots: 12,
                goals: 2
            },
            away: {
                possession: '45%',
                shots: 8,
                goals: 1
            }
        });
    };
    return (
        <div className="App">
            <div className='App-container'>
                <Row gutter={16} align="middle" style={{ marginBottom: '20px' }}>
                    <Col span={8}>
                        <Select
                            defaultValue=""
                            placeholder="Select Team B"
                            style={{ width: 120 }}
                            onChange={handleChange}
                            options={teamOptions}
                        />


                    </Col>
                    <Col span={8}>
                        <Select
                            defaultValue=""
                            placeholder="Select Team B"
                            style={{ width: 120 }}
                            onChange={handleChange}
                            options={teamOptions}
                        />
                    </Col>
                    <Col span={8}>
                        <Button type="primary" onClick={handleSubmit}>
                            Submit
                        </Button>
                    </Col>
                </Row>


                <Row gutter={16}>
                    <Col span={12}>
                        <Card title={`Home: ${homeTeam}`}>
                            <p>Possession: {stats.home.possession}</p>
                            <p>Shots: {stats.home.shots}</p>
                            <p>Goals: {stats.home.goals}</p>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title={`Away: ${awayTeam}`}>
                            <p>Possession: {stats.away.possession}</p>
                            <p>Shots: {stats.away.shots}</p>
                            <p>Goals: {stats.away.goals}</p>
                        </Card>
                    </Col>
                </Row>
            </div>


        </div>
    );
}

export default App;
