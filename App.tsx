import React, { useRef, useState } from 'react'
import { Button, Keyboard, Platform, SafeAreaView, StyleSheet, TextInput, View } from 'react-native'
import { WebView } from 'react-native-webview'

const App = () => {
  const [showGoogle, setShowGoogle] = useState(false)
  const [contentHeight, setContentHeight] = useState<Number|String>(0)
  const [uri, setUri] = useState("")
  const [query, setQuery] = useState("")
  const htmlViewRef = useRef<WebView>(null)

  const onLoadStart = (syntheticEvent:any)=> {
    const url:string = syntheticEvent.nativeEvent.url

    if(url != 'about:blank' && !url.match(/^https:\/\/www.google.com\/search\?q=/)) {
      htmlViewRef.current?.postMessage(url)
      setShowGoogle(false)
      setContentHeight('100%')
    }
  }
  
  const search = () => {
    if(!query || query.length == 0) return

    setUri(`https://www.google.com/search?q=${query}`)

    setShowGoogle(true)
    setContentHeight(0)

    Keyboard.dismiss()
  }

  const isAndroid= Platform.OS==='android'
  return (
    <SafeAreaView style={{flex: 1}}>
      <TextInput onChangeText={query => setQuery(query)} placeholder='input search word'/>
      <Button onPress={search} title='search'/>
      <View style={{height: contentHeight}}>
        <WebView
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{uri:isAndroid?'file:///android_asset/html-view/index.html':'./html-view/index.html'}}
          ref={htmlViewRef}
        />
      </View>
      {
        showGoogle ? 
        <WebView
          onLoadStart={onLoadStart}
          source={{ uri : uri }}
        /> :
        null
      }
    </SafeAreaView>
  )
}

export default App
