import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';


import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query'

const queryClient = new QueryClient({
  
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}


const Example =  () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['music'],
    queryFn: () =>
      fetch('http://localhost:3000/music-library').then((res) =>
        res.json(),
      ),
  })

  const playSong = useMutation({
    mutationFn: (index: number) => {
      return fetch(`http://localhost:3000/play/${index}`, {
        method: 'POST'
      }).then((res) =>
        res.json(),
      )
    },
  })


  const websocketURL = 'ws://localhost:3000';
  const { sendMessage, lastMessage, readyState, lastJsonMessage } = useWebSocket(websocketURL);

  useEffect(() => {
    const intervalHandle = setInterval(() => {
      console.log('ping');
      sendMessage('ping');
    }, 100);

    return () => {
      clearInterval(intervalHandle);
    }
  }, [])



  if (isPending) return <p>'Loading...'</p>

  if (error) return <p>{'An error has occurred: ' + error.message}</p>

  const playbackInfomation = lastJsonMessage as {
    trackLocationInSeconds: number
    trackLength: string
    fileName: string
  
  }

  return (
    <div>
      <h1>Music Library</h1>
      <h2>Now Playing</h2>
      <p>{playbackInfomation?.fileName}</p>
      <p>{`${(Math.floor(playbackInfomation?.trackLocationInSeconds / 60))}:${(playbackInfomation?.trackLocationInSeconds % 60).toFixed(0).padStart(2, "0")}`}</p>

      <ul>
        {data.map((file: string, index: number) => (
          <li key={file}>
            <button onClick={() => playSong.mutate(index)}>Play</button>
            {file}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App;
