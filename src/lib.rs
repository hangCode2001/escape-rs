use napi_derive::napi;
use napi::bindgen_prelude::*;

#[napi]
fn escape_html(string: String) -> String {
  // 快速路径：检查是否需要转义
  // 使用单次遍历而不是多次 memchr 调用
  let mut needs_escape = false;
  for &b in string.as_bytes() {
    if b == b'"' || b == b'\'' || b == b'&' || b == b'<' || b == b'>' {
      needs_escape = true;
      break;
    }
  }
  
  if !needs_escape {
    return string;
  }

  // 预分配内存空间
  let mut html = String::with_capacity(string.len() + string.len() / 10); // 假设约10%的字符需要转义
  let mut last_index = 0;

  for (index, c) in string.char_indices() {
    let escape = match c {
      '"' => Some("&quot;"),
      '&' => Some("&amp;"),
      '\'' => Some("&#x27;"),
      '<' => Some("&lt;"),
      '>' => Some("&gt;"),
      _ => None,
    };

    if let Some(escape_str) = escape {
      if last_index != index {
        html.push_str(&string[last_index..index]);
      }
      html.push_str(escape_str);
      last_index = index + c.len_utf8();
    }
  }

  if last_index < string.len() {
    html.push_str(&string[last_index..]);
  }

  html
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param text Text value to escape.
 * @return An escaped string.
 */
#[napi(js_name = "escapeTextForBrowser")]
fn escape_text_for_browser(text: Either3<String, f64, bool>) -> String {
  match text {
    // 数字和布尔值不需要转义，直接转换为字符串
    Either3::B(number) => number.to_string(),
    Either3::C(boolean) => boolean.to_string(),
    // 只有字符串需要转义
    Either3::A(string) => escape_html(string),
  }
}