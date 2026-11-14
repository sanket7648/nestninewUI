import { useApp } from './state/AppContext';
import { Sidebar } from './components/Sidebar';
import PropertiesList from './screens/PropertiesList';
import PropertyDetail from './screens/PropertyDetail';
import Wizard from './screens/wizard/Wizard';

export default function App() {
  const { view, toast } = useApp();

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        {view.name === 'list' && <PropertiesList />}
        {view.name === 'wizard' && <Wizard />}
        {view.name === 'property' && <PropertyDetail propertyId={view.propertyId} />}
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
