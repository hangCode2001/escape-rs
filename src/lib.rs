use napi_derive::napi;
use std::fmt::Display;

#[napi]
fn escape_html(string: String) -> String {
  let str = string;
  
  // 使用正则表达式匹配特殊字符
  if !str.contains(|c| c == '"' || c == '\'' || c == '&' || c == '<' || c == '>') {
    return str;
  }

  let mut html = String::new();
  let mut last_index = 0;

  for (index, c) in str.char_indices() {
    let escape = match c {
      '"' => Some("&quot;"),
      '&' => Some("&amp;"),
      '\'' => Some("&#x27;"), // modified from escape-html; used to be '&#39'
      '<' => Some("&lt;"),
      '>' => Some("&gt;"),
      _ => None,
    };

    if let Some(escape_str) = escape {
      if last_index != index {
        html.push_str(&str[last_index..index]);
      }
      html.push_str(escape_str);
      last_index = index + c.len_utf8();
    }
  }

  if last_index < str.len() {
    html.push_str(&str[last_index..]);
  }

  html
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param text Text value to escape.
 * @return An escaped string.
 */
#[napi]
fn escape_text_for_browser<T: Display>(text: T) -> String {
  let text_str = text.to_string();
  escape_html(text_str)
}