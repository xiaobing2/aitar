/**
 * 阿里云API代理函数
 * 添加到 webhook.js 的 handler 函数中
 */

/**
 * 代理阿里云API请求（解决CORS问题）
 */
export async function proxyAliAPI(body, headers) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp'
  }
  
  try {
    const requestData = typeof body === 'string' ? JSON.parse(body) : body
    const { apiKey, requestBody } = requestData
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('代理阿里云API错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
