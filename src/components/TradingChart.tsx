import { useEffect, useMemo, useRef } from 'react';
import { type IChartApi, type Time, createChart } from 'lightweight-charts';
import type { MarketBar } from '../api/client';

function toChartTime(iso: string): Time {
  // lightweight-charts accepts either UTC seconds or { year, month, day }.
  // We normalize to UTC seconds for intraday + daily.
  const ms = Date.parse(iso);
  return Math.floor(ms / 1000) as Time;
}

export function TradingChart({
  bars,
  height = 360,
  watermark,
}: {
  bars: MarketBar[];
  height?: number;
  watermark?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const seriesData = useMemo(
    () =>
      bars
        .map((b) => ({
          time: toChartTime(b.t),
          open: b.o,
          high: b.h,
          low: b.l,
          close: b.c,
        }))
        .sort((a, b) => Number(a.time) - Number(b.time)),
    [bars],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(245, 240, 232, 0.82)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
      crosshair: { vertLine: { color: 'rgba(212,168,83,0.35)' }, horzLine: { color: 'rgba(212,168,83,0.35)' } },
      watermark: watermark
        ? { visible: true, fontSize: 22, horzAlign: 'left', vertAlign: 'top', color: 'rgba(212,168,83,0.16)', text: watermark }
        : { visible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: 'rgba(111, 207, 151, 0.85)',
      downColor: 'rgba(232, 93, 93, 0.85)',
      borderVisible: false,
      wickUpColor: 'rgba(111, 207, 151, 0.85)',
      wickDownColor: 'rgba(232, 93, 93, 0.85)',
    });

    candleSeries.setData(seriesData);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, seriesData, watermark]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

