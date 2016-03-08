import fetchJsonp from 'fetch-jsonp';

export const RESET_VIEW_STATE = 'redux-autocomplete/autocomplete/RESET_VIEW_STATE';
export const SET_INITIAL_VALUE = 'redux-autocomplete/autocomplete/SET_INITIAL_VALUE';
export const SET_VALUE = 'redux-autocomplete/autocomplete/SET_VALUE';
export const UPDATE_HIGHLIGHTED_ITEM = 'redux-autocomplete/autocomplete/UPDATE_HIGHLIGHTED_ITEM';

export const SHOW_AUTOCOMPLETE_MENU = 'redux-autocomplete/autocomplete/SHOW_AUTOCOMPLETE_MENU';
export const HIDE_AUTOCOMPLETE_MENU = 'redux-autocomplete/autocomplete/HIDE_AUTOCOMPLETE_MENU';

export const FETCH_AUTOCOMPLETE_LIST = 'redux-autocomplete/autocomplete/FETCH_AUTOCOMPLETE_LIST';
export const FETCH_AUTOCOMPLETE_LIST_SUCCESS = 'redux-autocomplete/autocomplete/FETCH_AUTOCOMPLETE_LIST_SUCCESS';
export const FETCH_AUTOCOMPLETE_LIST_FAIL = 'redux-autocomplete/autocomplete/FETCH_AUTOCOMPLETE_LIST_FAIL';

const SENTINEL = -1;
const initialState = {
  highlightedIndex: SENTINEL,
  initialValue: '',
  isLoading: false,
  isMenuVisible: false,
  resultList: [],
  value: ''
};

export default function reducer(state = initialState, action = {}) {
  console.log('action: ', action);
  switch (action.type) {
    case RESET_VIEW_STATE:
      return initialState;
    case SHOW_AUTOCOMPLETE_MENU:
      return {
        ...state,
        isMenuVisible: true
      };
    case HIDE_AUTOCOMPLETE_MENU:
      return {
        ...state,
        isMenuVisible: false
      };
    case UPDATE_HIGHLIGHTED_ITEM:
      return {
        ...state,
        highlightedIndex: action.highlightedIndex,
        value: action.value
      };
    case SET_INITIAL_VALUE:
      return {
        ...state,
        initialValue: action.initialValue
      };
    case SET_VALUE:
      return {
        ...state,
        value: action.value
      };
    case FETCH_AUTOCOMPLETE_LIST:
      return {
        ...state,
        isLoading: true
      };
    case FETCH_AUTOCOMPLETE_LIST_SUCCESS:
      return {
        ...state,
        resultList: action.payload.list,
        isLoading: false
      };
    case FETCH_AUTOCOMPLETE_LIST_FAIL:
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
}

export function resetViewState() {
  return {
    type: RESET_VIEW_STATE,
  };
}

export function showAutocompleteMenu() {
  return {
    type: SHOW_AUTOCOMPLETE_MENU
  };
}

export function hideAutocompleteMenu() {
  return {
    type: HIDE_AUTOCOMPLETE_MENU
  };
}

export function setInitialValue(value) {
  return {
    type: SET_INITIAL_VALUE,
    initialValue: value
  }
}

export function setValue(value) {
  return {
    type: SET_VALUE,
    value
  }
}

export function selectHighlightedItem(highlightedIndex, value) {
  return {
    type: UPDATE_HIGHLIGHTED_ITEM,
    highlightedIndex,
    value
  }
}

export function fetchAutocompleteList(value) {
  return (dispatch, getState) => {
    dispatch({
      type: FETCH_AUTOCOMPLETE_LIST
    });

    const fetchList = () => {
      return fetchJsonp(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${value}`)
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          const [, values, , links] = json;
          return values.map((value, index) => {
            return {
              value,
              link: links[index]
            };
          });
        });
    };

    return fetchList()
      .then((list) => {
        return dispatch({
          type: FETCH_AUTOCOMPLETE_LIST_SUCCESS,
          payload: {
            list
          }
        });
      })
      .catch((error) => {
        return dispatch({
          type: FETCH_AUTOCOMPLETE_LIST_FAIL,
          error
        });
      });
  };
}
