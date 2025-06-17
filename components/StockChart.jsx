import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush
} from 'recharts';

function StockChart({
  data,
  title,
  gridColor = '#4A5568',
  onDateSelect,
}) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No stock data available to display.
      </div>
    );
  }

  const [responsiveChartHeight, setResponsiveChartHeight] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768; 
      setResponsiveChartHeight(isMobile ? 200 : 400);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const tailwindTextColors = [
    'text-red-400',
    'text-orange-400',
    'text-yellow-400',
    'text-green-400',
    'text-teal-400',
    'text-blue-400',
    'text-indigo-400',
    'text-purple-400',
    'text-pink-400',
    'text-amber-400',
    'text-lime-400',
    'text-emerald-400',
    'text-cyan-400',
    'text-sky-400',
    'text-violet-400',
    'text-fuchsia-400',
    'text-rose-400',
    'text-slate-400',
    'text-gray-400',
    'text-zinc-400',
    'text-neutral-400',
    'text-stone-400',
  ];
  const [randomColorClass, setRandomColorClass] = useState('');
  
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tailwindTextColors.length);
    setRandomColorClass(tailwindTextColors[randomIndex]);
  }, [title]);

  // Scale volume for better visualization (e.g., convert to millions)
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    volume: (item.volume || 0) / 1_000_000,
  }));

  // Debug: Log formattedData to check volume values
  console.log('Formatted Data:', formattedData);

  const brushOptions = [
    { label: '3 Days', value: 3 },
    { label: '1 Week', value: 7 },
    { label: '1 Year', value: 252 },
    { label: 'All', value: formattedData.length },
  ];
  const [brushLength, setBrushLength] = useState(60);

  useEffect(() => {
    setBrushLength(Math.min(60, formattedData.length));
  }, [formattedData.length]);

  const handleBrushOption = (days) => {
    setBrushLength(Math.min(days, formattedData.length));
  };

  let lineColor = '#00C805';
  if (data.length > 1) {
    const curr_open = data[data.length - 1].open;
    const curr_close = data[data.length - 1].close;
    lineColor = curr_close >= curr_open ? '#00C805' : '#FF3B30';
  }

  const handleClick = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0 && onDateSelect) {
      onDateSelect(e.activePayload[0].payload);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-sm md:text-lg font-semibold text-gray-400 mb-4">
        <span className={`text-md md:text-3xl font-black ${randomColorClass}`}>
          {title}
        </span>{' '}
        Historical Data Graph
      </h2>
      <div className="flex gap-2 mb-2">
        {brushOptions.map(opt => (
          <button
            key={opt.label}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              brushLength === Math.min(opt.value, formattedData.length)
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-green-800'
            }`}
            onClick={() => handleBrushOption(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={responsiveChartHeight}>
        <LineChart
          data={formattedData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10,
          }}
          onClick={handleClick}
        >
          <CartesianGrid
            stroke={gridColor}
            strokeDasharray="3 3"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            stroke="#718096"
            tick={{ fill: '#A0AEC0', fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
            tickMargin={8}
          />
          <YAxis
            dataKey="close"
            stroke="#718096"
            tick={{ fill: '#A0AEC0', fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            tickMargin={8}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#718096"
            tick={{ fill: '#A0AEC0', fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${value.toFixed(1)}M`} // Display in millions
            tickMargin={8}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2D3748',
              border: '1px solid #4A5568',
              borderRadius: '8px',
              color: '#E2E8F0',
              fontSize: 12,
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#A0AEC0', fontWeight: '500' }}
            itemStyle={{ color: '#E2E8F0' }}
            formatter={(value, name) => {
              if (name === 'Volume') {
                return [`${value.toFixed(1)}M`, 'Volume'];
              }
              return [`$${value.toFixed(2)}`, 'Close Price'];
            }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#E2E8F0', stroke: lineColor, strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
          <Line
            yAxisId="right"
            dataKey="volume"
            fill="#f5c542"
            dot={false}
            name="Volume"
            opacity={0.4}
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#f5c542', stroke: '#f5c542', strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
          <Brush
            dataKey="date"
            height={30}
            stroke="#1121ff"
            travellerWidth={8}
            startIndex={Math.max(0, formattedData.length - brushLength)}
            endIndex={formattedData.length - 1}
            tickFormatter={(date) => date}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;