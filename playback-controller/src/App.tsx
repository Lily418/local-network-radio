import React from 'react';
import logo from './logo.svg';
import './App.css';

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

  if (isPending) return <p>'Loading...'</p>

  if (error) return <p>{'An error has occurred: ' + error.message}</p>

  return (
    <div>
      <h1>Music Library</h1>
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
