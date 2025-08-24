import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

export const getChartOptions = (title: string, isDark: boolean): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: title,
      color: isDark ? '#fef3c7' : '#1f1408',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: isDark ? '#292524' : '#ffffff',
      titleColor: isDark ? '#fef3c7' : '#1f1408',
      bodyColor: isDark ? '#fef3c7' : '#1f1408',
      borderColor: isDark ? '#44403c' : '#fde68a',
      borderWidth: 1
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x' as const,
      },
      pan: {
        enabled: true,
        mode: 'x' as const,
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: isDark ? '#44403c' : '#fef3c7',
        display: true
      },
      ticks: {
        color: isDark ? '#fde68a' : '#78350f',
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      min: 0,
      max: 100,
      grid: {
        color: isDark ? '#44403c' : '#fef3c7',
        display: true
      },
      ticks: {
        color: isDark ? '#fde68a' : '#78350f',
        stepSize: 20
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
});

export const getChartData = (labels: string[], data: number[], color: string, isDark: boolean) => ({
  labels,
  datasets: [
    {
      data,
      borderColor: color,
      backgroundColor: `${color}33`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: color,
      pointBorderColor: isDark ? '#1f1408' : '#ffffff',
      pointBorderWidth: 2,
      pointHoverRadius: 6
    }
  ]
});