import 'babel-polyfill';
import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, compose} from 'redux';
import ReduxThunk from 'redux-thunk';
import reducer from './redux';
import Autocomplete from './containers/Autocomplete';
import DevTools from './containers/DevTools';

let store = compose(
  applyMiddleware(ReduxThunk),
  window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument()
)(createStore)(reducer);

// let store = createStore(reducer, applyMiddleware(ReduxThunk));

const classNames = {
  isHighlighted: 'isHighlighted',
  isLoading: 'isLoading',
  resultItem: 'resultItem',
  resultList: 'resultList',
  root: 'root',
  textBox: 'textBox'
};

function getResultItemValue(resultItem) {
  return resultItem.value;
}

function onEnterKeyDown(value, resultItem) {
  if (value || resultItem) {
    window.location.href = resultItem ? resultItem.link : `https://en.wikipedia.org/wiki/Special:Search?search=${value}`;
  }
}

function renderAfterTextBox() {
  return (
    <div className="button">
      <button onClick={this.handleEnterKeyDown}>Search</button>
    </div>
  );
}

function renderResultItem(resultItem) {
  const {
    link,
    value
  } = resultItem;
  return <a href={link}>{value}</a>;
}

render(
  <Provider store={store}>
    <div>
      <Autocomplete
        classNames={classNames}
        debounceDuration={250}
        getResultItemValue={getResultItemValue}
        onEnterKeyDown={onEnterKeyDown}
        renderAfterTextBox={renderAfterTextBox}
        renderResultItem={renderResultItem}
        shouldCacheResultList
      >
        <input type="text" placeholder="Search Wikipedia&hellip;" />
      </Autocomplete>
      <DevTools />
    </div>
  </Provider>,
  document.getElementById('root')
);
