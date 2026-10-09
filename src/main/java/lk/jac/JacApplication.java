package lk.jac;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@SpringBootApplication
@RestController
public class JacApplication {

	public static void main(String[] args) {
		SpringApplication.run(JacApplication.class, args);
		System.out.println("---Start application---");
	}

	//create simple mapping
	@RequestMapping("/")
	public String indexPage(){
		return "<h2>Hello world</h2>";
	}

	@RequestMapping("/test")
	public ModelAndView testPage(){
		ModelAndView testUI = new ModelAndView();
		testUI.setViewName("test.html");
		return testUI;
	}

}
 