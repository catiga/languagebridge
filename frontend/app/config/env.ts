export const ENV = {
  development: {
    API_BASE_URL: 'http://localhost:18080',
    APP_KEY: '9882768ab9183051ea9ce724d1e6b645a0581492a5bbbf9b23ca88a3d8051f7e',
    APP_ID: 'primary'
  },
  production: {
    API_BASE_URL: 'https://api.yourdomain.com',
    APP_KEY: '9882768ab9183051ea9ce724d1e6b645a0581492a5bbbf9b23ca88a3d8051f7e',
    APP_ID: 'primary'
  }
}

export const getEnvConfig = () => {
  return process.env.NODE_ENV === 'production' ? ENV.production : ENV.development
} 