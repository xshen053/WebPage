import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import Papa from 'papaparse';
import { Navbar, Nav } from 'react-bootstrap';
import Chart from 'chart.js/auto';

function HomeScreen() {
	const [chartData, setChartData] = useState(null);
	const [selectedColumn, setSelectedColumn] = useState(null);
	const [columnHeaders, setColumnHeaders] = useState([]);
	const [colorMap, setColorMap] = useState({});

	useEffect(() => {
		const fetchData = async () => {
			const response = await fetch('/data.csv');
			const reader = response.body.getReader();
			const result = await reader.read();
			const decoder = new TextDecoder('utf-8');
			const csv = decoder.decode(result.value);
			const { data, meta } = Papa.parse(csv, { header: true });

			if (data && data.length > 0) {
				const labels = data.map((row) => row[meta['fields'][0]]);
				const headers = Object.keys(data[0]).filter((key) => key !== meta['fields'][0]);

				const datasets = headers.map((header) => ({
					label: header,
					data: data.map((row) => row[header]),
					backgroundColor: getColorForColumn(header),
				}));

				setChartData({
					labels: labels,
					datasets: datasets,
				});

				setColumnHeaders(['All Data', ...headers]);
				setSelectedColumn(selectedColumn || 'All Data');
			}
		};

		fetchData();
	}, [selectedColumn]);

	const handleColumnSelect = (column) => {
		setSelectedColumn(column);
	};

	const getColorForColumn = (column) => {
		if (colorMap[column]) {
			return colorMap[column];
		} else {
			const color = getRandomColor();
			setColorMap((prevColorMap) => ({ ...prevColorMap, [column]: color }));
			return color;
		}
	};

	const getRandomColor = () => {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	};

	const truncateString = (str) => (str.length > 10 ? str.substring(0, 10) + '...' : str);
	const truncateStringsInArray = (array) => array.map((str) => truncateString(str));

	const chartOptions = {
		scales: {
			x: {
				type: 'category',
				labels: chartData ? truncateStringsInArray(chartData.labels) : [],
				maxBarThickness: 50,
			},
			y: {
				beginAtZero: true,
			},
		},
		plugins: {
			tooltip: {
				callbacks: {
					title: function (context) {
						return chartData.labels[context[0]['dataIndex']];
					},
				},
			},
		},
	};

	return (
		<div className="App">
		<Navbar bg="light" expand="lg">
		<Navbar.Brand>Stats</Navbar.Brand>
		<Navbar.Toggle aria-controls="basic-navbar-nav" />
		<Navbar.Collapse id="basic-navbar-nav">
		<Nav className="mr-auto">
		{columnHeaders.map((column) => (
			<Nav.Link
			key={column}
			href="#"
			active={selectedColumn === column}
			onClick={() => handleColumnSelect(column)}
			>
			{column}
			</Nav.Link>
		))}
		</Nav>
		</Navbar.Collapse>
		</Navbar>
		{chartData ? (
			<div>
			<h2>{selectedColumn} Stats</h2>
			{selectedColumn === 'All Data' ? (
				<Bar data={chartData} options={chartOptions} key={Math.random()} />
			) : (
				<Bar
				data={{
					labels: chartData.labels,
						datasets: chartData.datasets.filter((dataset) => dataset.label === selectedColumn),
				}}
				options={chartOptions}
				key={Math.random()}
				/>
			)}
			</div>
		) : (
			<p>Loading...</p>
		)}
		</div>
	);
}

function PriceScreen() {
	const [chartData, setChartData] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			const response = await fetch('/benchmark.log');
			const text = await response.text();

			const data = text
				.trim()
				.split('\n')
				.map((line) => {
					const [flags, time, improvement] = line.split(',');
					const price = (parseFloat(improvement) + 0.72) * 2540.4; // Multiply the improvement by a factor to get price in USD
					return { flags, time, improvement, price };
				});

			const labels = data.map((entry) => entry.flags);
			const improvements = data.map((entry) => entry.improvement);
			const prices = data.map((entry) => entry.price);

			setChartData({
				labels: labels,
				datasets: [
					{
						label: 'Yearly Cost Saving over default build on ARM',
						data: prices,
						backgroundColor: 'rgba(75,192,192,0.5)',
					},
				],
			});
		};

		fetchData();
	}, []);

	const chartOptions = {
		plugins: {
			tooltip: {
				callbacks: {
					label: function (context) {
						const value = context.raw.toFixed(2);
						return "Savings: $" + value;
					},
				},
			},
		},
	};

	return (
		<div>
		{chartData ? (
			<div>
			<h3>Improvement Graph</h3>
			<Bar data={chartData} options={chartOptions} />
			</div>
		) : (
			<p>Loading...</p>
		)}
		</div>
	);
}

function App() {
	const [activeScreen, setActiveScreen] = useState('home');

	const handleNavClick = (screen) => {
		setActiveScreen(screen);
	};

	return (
		<div className="App">
		<Navbar bg="light" expand="lg">
		<Navbar.Brand>HACO</Navbar.Brand>
		<Navbar.Toggle aria-controls="basic-navbar-nav" />
		<Navbar.Collapse id="basic-navbar-nav">
		<Nav className="mr-auto">
		<Nav.Link
		href="#home"
		active={activeScreen === 'home'}
		onClick={() => handleNavClick('home')}
		>
		Performance Stats
		</Nav.Link>
		<Nav.Link
		href="#price-screen"
		active={activeScreen === 'price-screen'}
		onClick={() => handleNavClick('price-screen')}
		>
		Price Stats
		</Nav.Link>
		</Nav>
		</Navbar.Collapse>
		</Navbar>
		{activeScreen === 'home' && <HomeScreen />}
		{activeScreen === 'price-screen' && <PriceScreen />}
		</div>
	);
}

export default App;

