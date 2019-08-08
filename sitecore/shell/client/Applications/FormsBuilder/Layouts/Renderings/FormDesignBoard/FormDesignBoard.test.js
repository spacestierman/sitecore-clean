(function(_sc) {

    describe("Given a FormDesignBoard component",
        function() {
            var sut = _sc.app.FormDesignBoard,
                $sutEl = $(sut.el);

            it("component should exist",
                function() {
                    expect(sut).toBeDefined();
                });
            it("component el should exist",
                function() {
                    expect($sutEl).toBeDefined();
                });
            it("component should have a IsVisible property",
                function() {
                    expect(sut.IsVisible).toBeDefined();
                });
            it("it should set 'isVisible' to true by default",
                function() {
                    expect(sut.get("isVisible")).toBe(true);
                });
            it("it should have a 'FormId' property set to '' by default",
                function() {
                    expect(sut.FormId).toBe("");
                });
            it("component should become invisible when I set the IsVisible property to false",
                function() {
                    expect($sutEl.css("display")).toBe("block");
                    sut.IsVisible = false;
                    expect($sutEl.css("display")).toBe("none");
                    sut.IsVisible = true;
                });


            describe("events tests",
                function() {
                    beforeEach(function() {
                        jasmine.Ajax.install();
                    });

                    afterEach(function() {
                        jasmine.Ajax.uninstall();
                    });


                    it("it should have a loadForm method that makes an ajax call",
                        function(done) {

                            sut.loadForm();
                            var url = "/FormBuilder/Index?id=&sc_formmode=edit";

                            setTimeout(function() {
                                    expect(jasmine.Ajax.requests.mostRecent().url.indexOf(url)).toBe(0);
                                    done();
                                },
                                1000);

                        });

                });


        });
})(Sitecore.Speak);