
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { MemberRecord, SummaryRow } from '../types';

interface AnalyticsViewProps {
  records: MemberRecord[];
  summary: SummaryRow[];
}

const COLORS = ['#3b3b8c', '#4c4ca6', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ summary }) => {
  // Prep data for charts
  const barData = summary
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const pieData = summary
    .filter(s => s.total > 0)
    .map(s => ({ name: s.updateType, value: s.total }));

  const timelineData = [1, 2, 3, 4, 5, 6].map(p => ({
    name: `Period ${p}`,
    count: summary.reduce((sum, s) => sum + s.periods[p-1], 0)
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Top Update Types */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Volume by Update Type</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="updateType" type="category" width={150} fontSize={10} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b3b8c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composition */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Distribution Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Trend Across Periods</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b3b8c" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Total Records" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
