import React from 'react';
import logo from './logo.svg';
import './App.css';

import {
  QueryClient,
  QueryClientProvider,
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

  if (isPending) return <p>'Loading...'</p>

  if (error) return <p>{'An error has occurred: ' + error.message}</p>

  return (
    <div>
      {JSON.stringify(data)}
    </div>
  )
}

export default App;
