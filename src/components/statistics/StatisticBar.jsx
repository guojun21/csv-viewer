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

  // 计算 model 统计
  const modelStats = React.useMemo(() => {
    if (!modelColumn || !data.length) return null
    
    const distribution = {}
    data.forEach(row => {
      const model = row[modelColumn] || 'Unknown'
      distribution[model] = (distribution[model] || 0) + 1
    })
    
    // 转换为数组并排序
    const models = Object.entries(distribution)
      .map(([name, count]) => ({ name, count, percentage: (count / data.length) * 100 }))
      .sort((a, b) => b.count - a.count)
    
    return { models, total: data.length }
  }, [data, modelColumn])

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


