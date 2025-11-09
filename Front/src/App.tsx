import SearchForm from './components/SearchForm';
import type { RestaurantSearch } from './types/Restaurant';
import './App.css';

function App() {
  const handleSearch = (searchData: RestaurantSearch) => {
    console.log('Search submitted:', searchData);
    // Handle your search logic here
  };

  return (
    <div className="app-container">
      <SearchForm onSubmit={handleSearch} />
    </div>
  );
}

export default App;
