import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Badge,
  Grid,
} from '@mui/material';
import { Send as SendIcon, ExitToApp as ExitToAppIcon } from '@mui/icons-material';

function ChatRoom({ socket, user, onLogout }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 메시지 목록이 변경될 때마다 스크롤
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // 최근 메시지 수신
    socket.on('recentMessages', (messages) => {
      setMessages(messages);
    });

    // 새 메시지 수신
    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // 온라인 사용자 목록 업데이트
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // 에러 처리
    socket.on('error', (error) => {
      setError(error.message);
    });

    return () => {
      socket.off('recentMessages');
      socket.off('newMessage');
      socket.off('onlineUsers');
      socket.off('error');
    };
  }, [socket]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !socket) return;

    socket.emit('chatMessage', message.trim());
    setMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Grid container spacing={2}>
      {/* 온라인 사용자 목록 */}
      <Grid item xs={12} md={3}>
        <Paper
          sx={{
            p: 2,
            height: '70vh',
            overflow: 'auto'
          }}
        >
          <Typography variant="h6" gutterBottom>
            온라인 사용자
            <Badge
              badgeContent={onlineUsers.length}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Typography>
          <List>
            {onlineUsers.map((user) => (
              <ListItem key={user._id}>
                <ListItemText primary={user.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* 채팅 영역 */}
      <Grid item xs={12} md={9}>
        <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
          {/* 헤더 */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              채팅방
              <IconButton
                color="inherit"
                onClick={onLogout}
                sx={{ float: 'right' }}
              >
                <ExitToAppIcon />
              </IconButton>
            </Typography>
          </Box>

          {/* 메시지 목록 */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            
            <List>
              {messages.map((msg, index) => (
                <React.Fragment key={index}>
                  {msg.type === 'system' ? (
                    <ListItem>
                      <ListItemText
                        secondary={
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ display: 'block' }}
                          >
                            {msg.text}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : (
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: msg.userId === user.userId ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {msg.userId === user.userId ? '나' : msg.name}
                      </Typography>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1,
                          bgcolor: msg.userId === user.userId ? 'primary.light' : 'grey.100',
                          maxWidth: '70%',
                        }}
                      >
                        <Typography variant="body1">{msg.text}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                          {formatTime(msg.timestamp)}
                        </Typography>
                      </Paper>
                    </ListItem>
                  )}
                  {index < messages.length - 1 && <Divider variant="middle" />}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* 메시지 입력 */}
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="메시지를 입력하세요"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!socket}
                />
              </Grid>
              <Grid item>
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={!message.trim() || !socket}
                >
                  전송
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default ChatRoom;
