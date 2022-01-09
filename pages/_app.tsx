import moment from 'moment';
import Head from 'next/head';
import * as Logger from '../util/logger';

import { useEffect } from 'react';
import { isDevelopment } from '../util';
import { LogLevel } from '../util/logger';
import type { AppProps } from 'next/app';

import {
    BUILT_AT,
    COMMIT_AUTHOR,
    COMMIT_HASH
} from '../util/build';

import '../components/styling/global.css';
import '../assets/icons/font-awesome/css/all.min.css';
import '../assets/scss/argon-design-system-react.scss';

const WATERMARK = `%c
        _,--',   _._.--._____    ___          _                           _            
 .--.--';_'-.', ";_      _.,-'  / __|__ _ _ _| |_ ___  __ _ _ _ __ _ _ __| |_  ___ _ _ 
.'--'.  _.'    {\`'-;_ .-.>.'   | (__/ _\` | '_|  _/ _ \\/ _\` | '_/ _\` | '_ \\ ' \\/ -_) '_|
      '-:_      )  / \`' '=.     \\___\\__,_|_|  \\__\\___/\\__, |_| \\__,_| .__/_||_\\___|_|  
        ) >     {_/,     /~)                          |___/         |_|                
        |/               \`^ .'
`;

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
    Logger.clear();
    useEffect(() => {
        Logger.raw(WATERMARK, 'color: #487eb0; font-weight: 600;');
        Logger.log(LogLevel.INFO, null, `This instance of Cartographer is running version %c${COMMIT_HASH?.substring(0,7) || 'no_git_id'} (${process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'})%c`, 'color: #888;', 'color: inherit;');
        
        if (isDevelopment())
            Logger.log(LogLevel.INFO, 'Build', `Signed by: %c${COMMIT_AUTHOR}%con ${moment(parseInt(BUILT_AT) * 1000).format('MMM Do, [at] h:mm:ss A')}`, 'color: #999;', 'color: inherit;');

    }, []);

    return (
        <>
            <Head>
                <title>Cartographer</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <meta name="author" content="ILEFA Labs" />
                <meta name="theme-color" content="#353b48" />
                <meta name="description" content="Cobalt Cartographer Utility - for internal use only." />
                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                <link rel="manifest" href="/manifest.json"/>
            </Head>
            <Component {...pageProps} />
        </>
    )
}

export default App;