import React from 'react'
import CostStatCard from './CostStatCard'
import ModelStatCard from './ModelStatCard'
import './StatisticBar.css'

/**
 * StatisticBar - 统计信息栏
 * 显示各字段的统计信息卡片
 */
function StatisticBar({ data, columns, glassMode }) {
  // 查找 cost 列
  const costColumn = columns.find(col => col.toLowerCase().includes('cost'))
  
  // 查找 model 列
  const modelColumn = columns.find(col => col.toLowerCase().includes('model'))

  // 计算 cost 统计
  const costStats = React.useMemo(() => {
    if (!costColumn || !data.length) return null
    
    const values = data
      .map(row => parseFloat(row[costColumn]?.replace('$', '') || 0))
      .filter(v => !isNaN(v))
    
    if (!values.length) return null
    
    const total = values.reduce((sum, v) => sum + v, 0)
    const avg = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    
    return { total, avg, max, min, count: values.length }
  }, [data, costColumn])

  // 计算 model 统计（包含每个模型的 cost）
  const modelStats = React.useMemo(() => {
    if (!modelColumn || !data.length) return null
    
    const distribution = {}
    data.forEach(row => {
      const model = row[modelColumn] || 'Unknown'
      if (!distribution[model]) {
        distribution[model] = { count: 0, cost: 0 }
      }
      distribution[model].count += 1
      
      // 累加 cost（如果有 cost 列）
      if (costColumn) {
        const cost = parseFloat(row[costColumn]?.replace('$', '') || 0)
        if (!isNaN(cost)) {
          distribution[model].cost += cost
        }
      }
    })
    
    // 转换为数组并排序
    const models = Object.entries(distribution)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        cost: data.cost,
        percentage: (data.count / data.length) * 100 
      }))
      .sort((a, b) => b.count - a.count)
    
    // 重新计算百分比（因为上面的 data.length 引用错误）
    const total = data.length
    models.forEach(m => {
      m.percentage = (m.count / total) * 100
    })
    
    return { models, total }
  }, [data, modelColumn, costColumn])

  if (!data.length) return null

  return (
    <div className="statistic-bar">
      {costStats && (
        <CostStatCard 
          stats={costStats} 
          columnName={costColumn}
          mode={glassMode}
        />
      )}
      
      {modelStats && (
        <ModelStatCard 
          stats={modelStats} 
          columnName={modelColumn}
          mode={glassMode}
        />
      )}
    </div>
  )
}

export default StatisticBar


