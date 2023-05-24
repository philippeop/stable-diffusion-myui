import "./../src/globals.scss";
import { wrapper } from './../src/store/store'
import Home from './../src/components/home'
import { Provider } from "react-redux";

export default function MyApp({ Component, pageProps }) {
    const { store, props } = wrapper.useWrappedStore(pageProps)
    return (
        <Provider store={store}>
            <Home {...pageProps} />
        </Provider>
    )
}