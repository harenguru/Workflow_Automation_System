import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import workflowRoutes from './routes/workflows'
import stepRoutes from './routes/steps'
import stepRulesRoutes from './routes/stepRules'
import ruleRoutes from './routes/rules'
import executionRoutes from './routes/executions'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/workflows', workflowRoutes)
app.use('/api/steps', stepRoutes)
app.use('/api', stepRulesRoutes)
app.use('/api/rules', ruleRoutes)
app.use('/api/executions', executionRoutes)

app.use(errorHandler)

export default app
