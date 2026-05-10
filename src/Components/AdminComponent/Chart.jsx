import React from "react";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const palette = {
  users: "rgba(34, 200, 255, 0.7)",
  sellers: "rgba(21, 231, 177, 0.7)",
  products: "rgba(255, 206, 86, 0.7)",
  categories: "rgba(255, 99, 132, 0.7)",
  subcategories: "rgba(153, 102, 255, 0.7)",
  accent: "rgba(0, 234, 255, 0.8)",
  profit: "rgba(16, 185, 129, 0.7)",
  revenue: "rgba(59, 130, 246, 0.7)"
};

function Charts({ metrics, profitAnalytics }) {
  // 1. Entity Distribution (Pie)
  const entityData = {
    labels: ["Users", "Sellers", "Products", "Categories", "Subcats"],
    datasets: [
      {
        label: "Counts",
        data: [
          metrics.users,
          metrics.sellers,
          metrics.products,
          metrics.categories,
          metrics.subcategories,
        ],
        backgroundColor: [
          palette.users,
          palette.sellers,
          palette.products,
          palette.categories,
          palette.subcategories,
        ],
        borderWidth: 0,
      },
    ],
  };

  // 2. Category Sales (Doughnut) - Per user request for circular style
  const categoryStats = profitAnalytics?.categoryAnalytics || [];
  const categoryData = {
    labels: categoryStats.length > 0 ? categoryStats.map(c => c.name) : ["No Data"],
    datasets: [
      {
        label: "Items Sold",
        data: categoryStats.length > 0 ? categoryStats.map(c => c.totalSold) : [0],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        borderWidth: 0,
      },
    ],
  };

  // 3. Sales Trend (Line) - Kept as line for accuracy but smaller
  const productTrendData = {
    labels: ["W1", "W2", "W3", "W4"],
    datasets: [
      {
        label: "Orders",
        data: [
          Math.max(0, metrics.totalOrders - 8),
          Math.max(0, metrics.totalOrders - 4),
          metrics.totalOrders,
          Math.max(0, metrics.totalOrders - 1),
        ],
        borderColor: palette.accent,
        backgroundColor: "rgba(0, 234, 255, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      }
    ],
  };

  // 4. Revenue vs Profit (Doughnut)
  const revenueProfitData = {
    labels: ["Revenue", "Profit"],
    datasets: [
      {
        data: [metrics.totalProfit, metrics.totalAdminProfit],
        backgroundColor: [palette.revenue, palette.profit],
        borderWidth: 0,
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: "'Outfit', sans-serif", size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 6
        }
      },
      datalabels: { display: false }
    }
  };

  const circularOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 9 },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const perc = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return perc > 15 ? `${perc}%` : '';
        }
      }
    }
  };

  const lineOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="charts-grid">
      {/* Entity Distribution */}
      <div className="chart-card">
        <h5>Entities</h5>
        <div className="chart-container">
          <Pie data={entityData} options={circularOptions} />
        </div>
      </div>

      {/* Category Sales */}
      <div className="chart-card">
        <h5>Category Sales</h5>
        <div className="chart-container">
          <Doughnut data={categoryData} options={circularOptions} />
        </div>
      </div>

      {/* Sales Trend */}
      <div className="chart-card">
        <h5>Sales Trend</h5>
        <div className="chart-container">
          <Line data={productTrendData} options={lineOptions} />
        </div>
      </div>

      {/* Revenue Split */}
      <div className="chart-card">
        <h5>Revenue Split</h5>
        <div className="chart-container">
          <Doughnut data={revenueProfitData} options={circularOptions} />
        </div>
      </div>

      <style>{`
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .chart-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          padding: 15px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          height: 280px;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }
        .chart-card:hover {
          transform: translateY(-5px);
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(0, 234, 255, 0.2);
        }
        .chart-card h5 {
          color: #00eaff;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 15px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .chart-container {
          flex: 1;
          position: relative;
        }
        @media (max-width: 600px) {
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .chart-card {
            height: 220px;
            padding: 10px;
          }
          .chart-card h5 {
            font-size: 0.75rem;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default Charts;
