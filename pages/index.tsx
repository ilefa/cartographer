import React from 'react';
import dynamic from 'next/dynamic';

function HomePage() {
    const Map = React.useMemo(() => dynamic(
        () => import('../components/Map'),
        { 
            loading: () => <p>Loading cartographer tools..</p>,
            ssr: false
        }
        ), []);

    return <Map />
}

export default HomePage;