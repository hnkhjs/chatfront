import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const handleLogin = async (userData) => {
    try {
      // 기존 소켓이 있다면 연결 해제
      if (socket) {
        socket.disconnect();
      }

      // 새로운 소켓 연결 생성
      const newSocket = io('http://localhost:5001', {
        autoConnect: false
      });

      // 소켓 이벤트 리스너 설정
      newSocket.on('connect', () => {
        console.log('Socket connected');
        // 연결 후 인증
        newSocket.emit('authenticate', { token: userData.token });
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message);
      });

      // 소켓 연결
      newSocket.connect();

      // 상태 업데이트
      setSocket(newSocket);
      setUser(userData);
      setError('');
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      if (socket) {
        socket.disconnect();
      }
      if (user) {
        await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: user.token }),
        });
      }
      setSocket(null);
      setUser(null);
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <ChatRoom
            socket={socket}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
